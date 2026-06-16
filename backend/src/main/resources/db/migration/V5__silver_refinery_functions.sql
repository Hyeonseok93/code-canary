-- flyway:executeInTransaction=false
-- V5__silver_refinery_functions.sql
-- Silver Layer DB-Level ETL (Option 1: INSERT...SELECT from JSONB)
-- Option 4: p_initial_load=TRUE skips child-table DELETE (for first-time ingestion)

-------------------------------------------------------------------------------
-- Helper: OSV published date repair (mirrors osv_refinery.py logic)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION silver.fix_osv_published(
    p_vuln_id TEXT,
    p_published TEXT,
    p_modified TEXT
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_year TEXT;
    v_current_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
BEGIN
    IF p_published IS NOT NULL AND p_published >= '1970-01-01' THEN
        RETURN p_published::TIMESTAMPTZ;
    END IF;

    v_year := SUBSTRING(p_vuln_id FROM '(19[0-9]{2}|20[0-9]{2})');
    IF v_year IS NOT NULL AND v_year::INT <= v_current_year THEN
        RETURN (v_year || '-01-01T00:00:00Z')::TIMESTAMPTZ;
    END IF;

    RETURN p_modified::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-------------------------------------------------------------------------------
-- Helper: NVD metrics key -> cvss_version
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION silver.normalize_cvss_version(p_metric_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE p_metric_key
        WHEN 'cvssMetricV40' THEN '4.0'
        WHEN 'cvssMetricV31' THEN '3.1'
        WHEN 'cvssMetricV30' THEN '3.0'
        WHEN 'cvssMetricV3'  THEN '3.0'
        WHEN 'cvssMetricV2'  THEN '2.0'
        ELSE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            REPLACE(p_metric_key, 'cvssMetricV', ''), '31', '3.1'), '30', '3.0'), '40', '4.0'), '2', '2.0'), '3', '3.0')
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-------------------------------------------------------------------------------
-- OSV Silver Refinery Batch
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION silver.refine_osv_batch(
    p_batch_size INTEGER DEFAULT 5000,
    p_initial_load BOOLEAN DEFAULT TRUE
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DROP TABLE IF EXISTS tmp_osv_batch;
    CREATE TEMP TABLE tmp_osv_batch ON COMMIT DROP AS
    SELECT
        b.id          AS bronze_id,
        b.vulnerability_id AS osv_id,
        b.raw_content
    FROM bronze.raw_vulnerability_data b
    WHERE b.source_type = 'OSV'
      AND b.processed_status IN ('PENDING', 'ERROR')
      AND b.raw_content IS NOT NULL
      AND b.raw_content->>'id' IS NOT NULL
    LIMIT p_batch_size;

    SELECT COUNT(*) INTO v_count FROM tmp_osv_batch;
    IF v_count = 0 THEN
        RETURN 0;
    END IF;

    -- [1] Master upsert
    INSERT INTO silver.osv_vulnerabilities (
        id, schema_version, published, modified, withdrawn,
        summary, details, database_specific
    )
    SELECT
        b.osv_id,
        b.raw_content->>'schema_version',
        silver.fix_osv_published(b.osv_id, b.raw_content->>'published', b.raw_content->>'modified'),
        (b.raw_content->>'modified')::TIMESTAMPTZ,
        NULLIF(b.raw_content->>'withdrawn', '')::TIMESTAMPTZ,
        b.raw_content->>'summary',
        b.raw_content->>'details',
        COALESCE(b.raw_content->'database_specific', '{}'::JSONB)
    FROM tmp_osv_batch b
    ON CONFLICT (id) DO UPDATE SET
        schema_version    = EXCLUDED.schema_version,
        published         = EXCLUDED.published,
        modified          = EXCLUDED.modified,
        withdrawn         = EXCLUDED.withdrawn,
        summary           = EXCLUDED.summary,
        details           = EXCLUDED.details,
        database_specific = EXCLUDED.database_specific;

    -- [2] Child DELETE (skip on initial load)
    IF NOT p_initial_load THEN
        DELETE FROM silver.osv_identifiers WHERE osv_id IN (SELECT osv_id FROM tmp_osv_batch);
        DELETE FROM silver.osv_affected   WHERE osv_id IN (SELECT osv_id FROM tmp_osv_batch);
        DELETE FROM silver.osv_references WHERE osv_id IN (SELECT osv_id FROM tmp_osv_batch);
        DELETE FROM silver.osv_severities WHERE osv_id IN (SELECT osv_id FROM tmp_osv_batch);
        DELETE FROM silver.osv_credits    WHERE osv_id IN (SELECT osv_id FROM tmp_osv_batch);
    END IF;

    -- [3] Child inserts
    INSERT INTO silver.osv_identifiers (osv_id, id_type, target_id)
    SELECT b.osv_id, 'ALIAS', elem
    FROM tmp_osv_batch b,
         jsonb_array_elements_text(COALESCE(b.raw_content->'aliases', '[]'::JSONB)) AS elem
    UNION ALL
    SELECT b.osv_id, 'RELATED', elem
    FROM tmp_osv_batch b,
         jsonb_array_elements_text(COALESCE(b.raw_content->'related', '[]'::JSONB)) AS elem
    UNION ALL
    SELECT b.osv_id, 'UPSTREAM', elem
    FROM tmp_osv_batch b,
         jsonb_array_elements_text(COALESCE(b.raw_content->'upstream', '[]'::JSONB)) AS elem;

    INSERT INTO silver.osv_affected (
        osv_id, package_name, ecosystem, purl,
        ranges, versions, severity, database_specific, ecosystem_specific
    )
    SELECT
        b.osv_id,
        aff->'package'->>'name',
        aff->'package'->>'ecosystem',
        aff->'package'->>'purl',
        COALESCE(aff->'ranges', '[]'::JSONB),
        COALESCE(aff->'versions', '[]'::JSONB),
        COALESCE(aff->'severity', '[]'::JSONB),
        COALESCE(aff->'database_specific', '{}'::JSONB),
        COALESCE(aff->'ecosystem_specific', '{}'::JSONB)
    FROM tmp_osv_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'affected', '[]'::JSONB)) AS aff;

    INSERT INTO silver.osv_references (osv_id, type, url)
    SELECT b.osv_id, ref->>'type', ref->>'url'
    FROM tmp_osv_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'references', '[]'::JSONB)) AS ref;

    INSERT INTO silver.osv_severities (osv_id, type, score_string)
    SELECT b.osv_id, sev->>'type', sev->>'score'
    FROM tmp_osv_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'severity', '[]'::JSONB)) AS sev;

    INSERT INTO silver.osv_credits (osv_id, name, type, contacts)
    SELECT
        b.osv_id,
        credit->>'name',
        credit->>'type',
        COALESCE(credit->'contact', '[]'::JSONB)
    FROM tmp_osv_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'credits', '[]'::JSONB)) AS credit;

    -- [4] Bronze status update
    UPDATE bronze.raw_vulnerability_data
    SET processed_status = 'PROCESSED',
        last_error_message = NULL
    WHERE id IN (SELECT bronze_id FROM tmp_osv_batch);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------
-- NVD Silver Refinery Batch
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION silver.refine_nvd_batch(
    p_batch_size INTEGER DEFAULT 5000,
    p_initial_load BOOLEAN DEFAULT TRUE
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DROP TABLE IF EXISTS tmp_nvd_batch;
    CREATE TEMP TABLE tmp_nvd_batch ON COMMIT DROP AS
    SELECT
        b.id AS bronze_id,
        b.vulnerability_id AS cve_id,
        b.raw_content
    FROM bronze.raw_vulnerability_data b
    WHERE b.source_type = 'NVD'
      AND b.processed_status IN ('PENDING', 'ERROR')
      AND b.raw_content IS NOT NULL
      AND b.raw_content->>'id' IS NOT NULL
    LIMIT p_batch_size;

    SELECT COUNT(*) INTO v_count FROM tmp_nvd_batch;
    IF v_count = 0 THEN
        RETURN 0;
    END IF;

    -- [1] Master upsert
    INSERT INTO silver.cve_vulnerabilities (
        id, source_identifier, published, last_modified, vuln_status,
        evaluator_solution, evaluator_impact, evaluator_comment,
        cisa_exploit_add, cisa_action_due, cisa_required_action, cisa_vulnerability_name
    )
    SELECT
        b.cve_id,
        b.raw_content->>'sourceIdentifier',
        (b.raw_content->>'published')::TIMESTAMPTZ,
        (b.raw_content->>'lastModified')::TIMESTAMPTZ,
        b.raw_content->>'vulnStatus',
        b.raw_content->>'evaluatorSolution',
        b.raw_content->>'evaluatorImpact',
        b.raw_content->>'evaluatorComment',
        NULLIF(b.raw_content->>'cisaExploitAdd', '')::DATE,
        NULLIF(b.raw_content->>'cisaActionDue', '')::DATE,
        b.raw_content->>'cisaRequiredAction',
        b.raw_content->>'cisaVulnerabilityName'
    FROM tmp_nvd_batch b
    ON CONFLICT (id) DO UPDATE SET
        source_identifier       = EXCLUDED.source_identifier,
        published               = EXCLUDED.published,
        last_modified           = EXCLUDED.last_modified,
        vuln_status             = EXCLUDED.vuln_status,
        evaluator_solution      = EXCLUDED.evaluator_solution,
        evaluator_impact        = EXCLUDED.evaluator_impact,
        evaluator_comment       = EXCLUDED.evaluator_comment,
        cisa_exploit_add        = EXCLUDED.cisa_exploit_add,
        cisa_action_due         = EXCLUDED.cisa_action_due,
        cisa_required_action    = EXCLUDED.cisa_required_action,
        cisa_vulnerability_name = EXCLUDED.cisa_vulnerability_name;

    -- [2] Child DELETE (skip on initial load)
    IF NOT p_initial_load THEN
        DELETE FROM silver.cve_descriptions     WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
        DELETE FROM silver.cve_metrics          WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
        DELETE FROM silver.cve_references       WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
        DELETE FROM silver.cve_weaknesses       WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
        DELETE FROM silver.cve_configurations   WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
        DELETE FROM silver.cve_tags             WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
        DELETE FROM silver.cve_vendor_comments  WHERE cve_id IN (SELECT cve_id FROM tmp_nvd_batch);
    END IF;

    -- [3] Child inserts
    INSERT INTO silver.cve_descriptions (cve_id, lang, value)
    SELECT b.cve_id, desc_elem->>'lang', desc_elem->>'value'
    FROM tmp_nvd_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'descriptions', '[]'::JSONB)) AS desc_elem;

    INSERT INTO silver.cve_metrics (
        cve_id, cvss_version, source, type, vector_string,
        base_score, base_severity, attack_vector, attack_complexity,
        user_interaction, cvss_data
    )
    SELECT
        b.cve_id,
        silver.normalize_cvss_version(mk.key),
        metric_item->>'source',
        metric_item->>'type',
        metric_item->'cvssData'->>'vectorString',
        (metric_item->'cvssData'->>'baseScore')::NUMERIC,
        COALESCE(metric_item->'cvssData'->>'baseSeverity', metric_item->>'baseSeverity'),
        COALESCE(metric_item->'cvssData'->>'attackVector', metric_item->'cvssData'->>'accessVector'),
        COALESCE(metric_item->'cvssData'->>'attackComplexity', metric_item->'cvssData'->>'accessComplexity'),
        COALESCE(
            metric_item->'cvssData'->>'userInteraction',
            CASE
                WHEN (metric_item->'cvssData'->>'userInteractionRequired')::BOOLEAN IS TRUE THEN 'REQUIRED'
                WHEN metric_item->'cvssData' ? 'userInteractionRequired' THEN 'NONE'
                ELSE NULL
            END
        ),
        COALESCE(metric_item->'cvssData', '{}'::JSONB)
            || jsonb_strip_nulls(jsonb_build_object(
                'exploitabilityScore', metric_item->'exploitabilityScore',
                'impactScore', metric_item->'impactScore'
            ))
    FROM tmp_nvd_batch b,
         jsonb_each(COALESCE(b.raw_content->'metrics', '{}'::JSONB)) AS mk(key, val),
         jsonb_array_elements(val) AS metric_item;

    INSERT INTO silver.cve_references (cve_id, url, source, tags)
    SELECT
        b.cve_id,
        ref->>'url',
        ref->>'source',
        COALESCE(ref->'tags', '[]'::JSONB)
    FROM tmp_nvd_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'references', '[]'::JSONB)) AS ref;

    INSERT INTO silver.cve_weaknesses (cve_id, source, type, cwe_id)
    SELECT
        b.cve_id,
        weak->>'source',
        weak->>'type',
        desc_elem->>'value'
    FROM tmp_nvd_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'weaknesses', '[]'::JSONB)) AS weak,
         jsonb_array_elements(COALESCE(weak->'description', '[]'::JSONB)) AS desc_elem
    WHERE desc_elem->>'lang' = 'en';

    INSERT INTO silver.cve_configurations (cve_id, nodes)
    SELECT b.cve_id, b.raw_content->'configurations'
    FROM tmp_nvd_batch b
    WHERE jsonb_array_length(COALESCE(b.raw_content->'configurations', '[]'::JSONB)) > 0;

    INSERT INTO silver.cve_tags (cve_id, source_identifier, tag)
    SELECT
        b.cve_id,
        tag_item->>'sourceIdentifier',
        tag_item->'tags'->>0
    FROM tmp_nvd_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'cveTags', '[]'::JSONB)) AS tag_item
    WHERE jsonb_array_length(COALESCE(tag_item->'tags', '[]'::JSONB)) > 0;

    INSERT INTO silver.cve_vendor_comments (cve_id, organization, comment, last_modified)
    SELECT
        b.cve_id,
        vc->>'organization',
        vc->>'comment',
        NULLIF(vc->>'lastModified', '')::TIMESTAMPTZ
    FROM tmp_nvd_batch b,
         jsonb_array_elements(COALESCE(b.raw_content->'vendorComments', '[]'::JSONB)) AS vc;

    -- [4] Bronze status update
    UPDATE bronze.raw_vulnerability_data
    SET processed_status = 'PROCESSED',
        last_error_message = NULL
    WHERE id IN (SELECT bronze_id FROM tmp_nvd_batch);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

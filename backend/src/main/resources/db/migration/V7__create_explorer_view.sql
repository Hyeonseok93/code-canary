-- flyway:executeInTransaction=false
-- V7__create_explorer_view.sql
-- Explorer: Advanced Search Engine aligned with Dashboard Taxonomy
-- Integrated with Attack Vector, Remediation, Weakness Pillar, and Ecosystems

DROP MATERIALIZED VIEW IF EXISTS gold.v_explorer_inventory;

CREATE MATERIALIZED VIEW gold.v_explorer_inventory AS
WITH cve_enriched AS (
    SELECT 
        v.id as vuln_id,
        'NVD' as source,
        (SELECT m.base_score FROM silver.cve_metrics m WHERE m.cve_id = v.id ORDER BY m.cvss_version DESC, m.type = 'Primary' DESC LIMIT 1) as base_score,
        v.published as published_date,
        v.last_modified as modified_date,
        (SELECT d.value FROM silver.cve_descriptions d WHERE d.cve_id = v.id AND d.lang = 'en' LIMIT 1) as summary,
        -- Status (Original)
        v.vuln_status as status,
        -- Attack Vector (from existing taxonomy)
        COALESCE((SELECT m.attack_vector FROM silver.cve_metrics m WHERE m.cve_id = v.id ORDER BY m.cvss_version DESC, m.type = 'Primary' DESC LIMIT 1), 'UNKNOWN') as attack_vector,
        -- Remediation Status (Synchronized with gold.v_remediation_analysis)
        COALESCE((SELECT r.remediation_status FROM gold.v_remediation_analysis r WHERE r.id = v.id LIMIT 1), 'Pending') as remediation_status,
        -- Weakness Pillar (Integrated with gold.cwe_definitions)
        (
            SELECT d.pillar FROM gold.cwe_definitions d 
            JOIN silver.cve_weaknesses w ON d.cwe_id = w.cwe_id 
            WHERE w.cve_id = v.id LIMIT 1
        ) as weakness_pillar,
        'N/A' as ecosystems,
        -- KEV Intelligence
        CASE WHEN v.cisa_exploit_add IS NOT NULL THEN TRUE ELSE FALSE END as is_kev,
        v.cisa_action_due as kev_due_date
    FROM silver.cve_vulnerabilities v
),
osv_enriched AS (
    SELECT 
        o.id as vuln_id,
        CASE WHEN o.id LIKE 'MAL-%' THEN 'MAL' ELSE 'OSV' END as source,
        (SELECT s.calculated_score FROM gold.intel_osv_scores s WHERE s.osv_id = o.id LIMIT 1) as base_score,
        (CASE 
            WHEN o.published < '1970-01-01' OR o.published IS NULL THEN 
                COALESCE(
                    (NULLIF(SUBSTRING(o.id FROM '(19[0-9]{2}|20[0-9]{2})'), '') || '-01-01')::DATE, 
                    o.modified
                )
            ELSE o.published 
        END) as published_date,
        o.modified as modified_date,
        COALESCE(o.summary, o.details) as summary,
        -- Status (Original)
        CASE WHEN o.withdrawn IS NOT NULL THEN 'Withdrawn' ELSE 'Active' END as status,
        -- Attack Vector for OSV (Integrated with gold.intel_vector_analysis)
        COALESCE((SELECT attack_vector FROM gold.intel_vector_analysis WHERE vuln_id = o.id LIMIT 1), 'UNKNOWN') as attack_vector,
        -- Remediation Status for OSV (Synchronized with gold.v_remediation_analysis)
        COALESCE((SELECT r.remediation_status FROM gold.v_remediation_analysis r WHERE r.id = o.id LIMIT 1), 'Unpatched') as remediation_status,
        -- Weakness Pillar for OSV (Only show if defined, otherwise NULL for 'Not Specified')
        NULL::TEXT as weakness_pillar,
        (SELECT string_agg(DISTINCT SPLIT_PART(a.ecosystem, ':', 1), ', ') FROM silver.osv_affected a WHERE a.osv_id = o.id) as ecosystems,
        -- KEV Intelligence (OSV rarely has KEV directly unless it's a CVE alias, which is handled via NVD)
        FALSE as is_kev,
        NULL::DATE as kev_due_date
    FROM silver.osv_vulnerabilities o
    WHERE o.id NOT LIKE 'CVE-%'
)
SELECT 
    *,
    -- Full-Text Search Vector (Vuln ID + Summary + Attack Vector + Pillar + Status)
    setweight(to_tsvector('english', COALESCE(vuln_id, '')), 'A') || 
    setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(attack_vector, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(weakness_pillar, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(status, '')), 'D') as search_vector
FROM (
    SELECT * FROM cve_enriched
    UNION ALL
    SELECT * FROM osv_enriched
) combined
WHERE published_date >= '1970-01-01' OR published_date IS NULL;

-- 1. Optimized Pagination Index
CREATE INDEX idx_explorer_pagination ON gold.v_explorer_inventory (published_date DESC NULLS LAST, vuln_id DESC);

-- 2. Full-Text Search Index (GIN)
CREATE INDEX idx_explorer_search ON gold.v_explorer_inventory USING GIN(search_vector);

-- 3. Taxonomy Filtering Indexes
CREATE INDEX idx_explorer_vector ON gold.v_explorer_inventory (attack_vector);
CREATE INDEX idx_explorer_remediation ON gold.v_explorer_inventory (remediation_status);
CREATE INDEX idx_explorer_pillar ON gold.v_explorer_inventory (weakness_pillar);
CREATE INDEX idx_explorer_status ON gold.v_explorer_inventory (status);

COMMENT ON MATERIALIZED VIEW gold.v_explorer_inventory IS 'Unified inventory aligned with Dashboard taxonomy and original vulnerability status.';

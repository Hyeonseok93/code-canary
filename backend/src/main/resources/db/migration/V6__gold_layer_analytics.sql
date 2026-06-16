-- flyway:executeInTransaction=false
-- V6__gold_layer_analytics.sql
-- Medallion Architecture: Gold Layer (Analytics & Insights)
-- Focus: High-Performance Snapshot Tables with Remediation Dashboard Integration
-- Strategy: Standardized Full Refresh (Snapshot) - All tables are truncated and re-populated 
--           during each refinery run to ensure maximum data accuracy and consistency.

CREATE SCHEMA IF NOT EXISTS gold;

-------------------------------------------------------------------------------
-- [PART 1] INTELLIGENCE BASE TABLES (Core Metadata)
-------------------------------------------------------------------------------

-- [1.1] 통합 지표 요약 테이블
CREATE TABLE IF NOT EXISTS gold.intel_summary (
    metric_key VARCHAR(50) PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value BIGINT DEFAULT 0,
    description TEXT,
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 세팅
INSERT INTO gold.intel_summary (metric_key, metric_name, description) VALUES
('total_intelligence', 'Total Intelligence', '중복 제거된 전체 취약점 식별자 수 (NVD + OSV non-CVE, MAL 포함)'),
('active_exploits', 'Active Exploits', 'CISA KEV에 등록되어 실제 공격에 악용 중인 취약점 수'),
('critical_weaknesses', 'Critical Weaknesses', '심각도가 CRITICAL(9.0 이상)인 고위험 취약점 수'),
('new_discoveries', 'New Discoveries', '최근 24시간 이내에 새롭게 공표된 취약점 수'),
('recent_updates', 'Recent Updates', '최근 24시간 이내에 정보가 갱신되거나 수정된 취약점 수'),
('unpatched_threats', 'Unpatched Threats', '패치나 해결책이 없고 지원도 종료되지 않은 실제 방치된 위협 수'),
('analysis_backlog', 'Analysis Backlog', 'NVD에서 분석이 대기 중이거나 진행 중인 취약점 수'),
('intelligence_span', 'Intelligence Span', '엔진이 보유한 데이터의 연도 범위 (1970년 이후 기준)')
ON CONFLICT (metric_key) DO UPDATE SET
    metric_name = EXCLUDED.metric_name,
    description = EXCLUDED.description;

-- [1.2] OSV 점수 보강 데이터
CREATE TABLE IF NOT EXISTS gold.intel_osv_scores (
    osv_id VARCHAR(100) PRIMARY KEY,
    calculated_score NUMERIC(3,1),
    severity_label VARCHAR(20),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gold_osv_score ON gold.intel_osv_scores(calculated_score);

-- [1.3] 통합 벡터 분석 데이터
CREATE TABLE IF NOT EXISTS gold.intel_vector_analysis (
    id BIGSERIAL PRIMARY KEY,
    vuln_id VARCHAR(100) NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    cvss_version VARCHAR(10),
    full_vector TEXT NOT NULL,
    attack_vector VARCHAR(50),
    published_year INT,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_gold_vector_unique ON gold.intel_vector_analysis (vuln_id, full_vector);

-- [1.4] CWE Definitions Master
CREATE TABLE IF NOT EXISTS gold.cwe_definitions (
    cwe_id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pillar VARCHAR(100) NOT NULL, -- Core Category (e.g., Memory Safety, Injection)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- [1.5] Silver Layer Schema Enhancement
ALTER TABLE silver.osv_severities ADD COLUMN IF NOT EXISTS normalized_vector VARCHAR(255);
ALTER TABLE silver.osv_severities ADD COLUMN IF NOT EXISTS attack_vector VARCHAR(50);
ALTER TABLE silver.osv_severities ADD COLUMN IF NOT EXISTS base_score NUMERIC(3,1);

-------------------------------------------------------------------------------
-- [PART 2] ANALYTICS SNAPSHOT TABLES (Snapshot Tables for Dashboard)
-------------------------------------------------------------------------------

-- [2.1] Risk Profile (risk_)
CREATE TABLE IF NOT EXISTS gold.risk_distribution (
    severity_label VARCHAR(20) PRIMARY KEY,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold.risk_annual_trend (
    pub_year INT PRIMARY KEY,
    critical_count BIGINT DEFAULT 0, high_count BIGINT DEFAULT 0,
    medium_count BIGINT DEFAULT 0, low_count BIGINT DEFAULT 0,
    total_count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- [2.2] Attack Vector (vector_)
CREATE TABLE IF NOT EXISTS gold.vector_distribution (
    label VARCHAR(50) PRIMARY KEY,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold.vector_annual_trend (
    pub_year INT PRIMARY KEY,
    network_count BIGINT DEFAULT 0, adjacent_count BIGINT DEFAULT 0,
    local_count BIGINT DEFAULT 0, physical_count BIGINT DEFAULT 0,
    total_count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- [2.3] Data Source (source_)
CREATE TABLE IF NOT EXISTS gold.source_distribution (
    label VARCHAR(50) PRIMARY KEY,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold.source_annual_trend (
    pub_year INT PRIMARY KEY,
    nvd_count BIGINT DEFAULT 0, osv_count BIGINT DEFAULT 0,
    mal_count BIGINT DEFAULT 0, total_count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- [2.4] Ecosystem Analysis
CREATE TABLE IF NOT EXISTS gold.ecosystem_distribution (
    ecosystem VARCHAR(100) PRIMARY KEY,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold.ecosystem_annual_trend (
    pub_year INT NOT NULL,
    ecosystem VARCHAR(100) NOT NULL,
    count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pub_year, ecosystem)
);

-- [2.5] Weakness Explorer
CREATE TABLE IF NOT EXISTS gold.weakness_pillar_stats (
    pillar VARCHAR(100) PRIMARY KEY,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold.weakness_detail_stats (
    cwe_id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pillar VARCHAR(100) NOT NULL,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- [2.6] Remediation Dashboard
CREATE TABLE IF NOT EXISTS gold.remediation_distribution (
    label VARCHAR(50) PRIMARY KEY,
    count BIGINT DEFAULT 0,
    percentage NUMERIC(5,2),
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold.remediation_annual_trend (
    pub_year INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pub_year, label)
);

-- [2.7] KEV Intelligence Grid (Top 15)
CREATE TABLE IF NOT EXISTS gold.latest_kev_insights (
    cve_id VARCHAR(30) PRIMARY KEY,                -- CVE 식별자
    name TEXT NOT NULL,                             -- CISA 공식 명칭
    base_score NUMERIC(3,1),                        -- CVSS 위험 점수
    added_date DATE NOT NULL,                       -- KEV 등록일
    due_date DATE,                                  -- 조치 마감일
    d_day INTEGER,                                  -- 마감까지 남은 일수
    weakness_type TEXT,                             -- 취약점 유형 (CWE Pillar)
    remediation_status TEXT,                        -- 패치 가능 상태 (Patch Ready 등)
    
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gold_kev_added_date ON gold.latest_kev_insights(added_date DESC);

-------------------------------------------------------------------------------
-- [PART 3] CALCULATION VIEWS (Views used to populate snapshots)
-------------------------------------------------------------------------------

-- [3.1] 통합 기초 등급 뷰 (Helper)
CREATE OR REPLACE VIEW gold.v_unified_severity AS
WITH combined_data AS (
    SELECT v.id, EXTRACT(YEAR FROM v.published)::INT as pub_year, m.base_score as score,
           CASE WHEN m.base_score >= 9.0 THEN 'Critical' WHEN m.base_score >= 7.0 THEN 'High'
                WHEN m.base_score >= 4.0 THEN 'Medium' WHEN m.base_score > 0.0  THEN 'Low' ELSE 'None' END as severity_label
    FROM silver.cve_vulnerabilities v JOIN silver.cve_metrics m ON v.id = m.cve_id
    WHERE v.vuln_status NOT IN ('Rejected', 'Deferred')
    UNION ALL
    SELECT o.id, 
           EXTRACT(YEAR FROM (
               CASE 
                   WHEN o.published < '1970-01-01' OR o.published IS NULL THEN 
                       COALESCE(
                           (NULLIF(SUBSTRING(o.id FROM '(19[0-9]{2}|20[0-9]{2})'), '') || '-01-01')::DATE, 
                           o.modified
                       )
                   ELSE o.published 
               END
           ))::INT as pub_year, 
           s.calculated_score as score,
           CASE WHEN s.calculated_score >= 9.0 THEN 'Critical' WHEN s.calculated_score >= 7.0 THEN 'High'
                WHEN s.calculated_score >= 4.0 THEN 'Medium' WHEN s.calculated_score > 0.0  THEN 'Low' ELSE 'None' END as severity_label
    FROM silver.osv_vulnerabilities o JOIN gold.intel_osv_scores s ON o.id = s.osv_id
    WHERE o.id NOT LIKE 'CVE-%'
)
SELECT * FROM combined_data WHERE pub_year >= 1970 AND pub_year <= EXTRACT(YEAR FROM NOW()) AND severity_label != 'None';

-- [3.2] Risk Calculation Views
CREATE OR REPLACE VIEW gold.v_risk_distribution AS
SELECT severity_label, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM gold.v_unified_severity GROUP BY severity_label;

CREATE OR REPLACE VIEW gold.v_risk_annual_trend AS
SELECT pub_year, COUNT(*) FILTER (WHERE severity_label = 'Critical') as critical_count,
       COUNT(*) FILTER (WHERE severity_label = 'High') as high_count,
       COUNT(*) FILTER (WHERE severity_label = 'Medium') as medium_count,
       COUNT(*) FILTER (WHERE severity_label = 'Low') as low_count, COUNT(*) as total_count
FROM gold.v_unified_severity GROUP BY pub_year;

-- [3.3] Vector Calculation Views
CREATE OR REPLACE VIEW gold.v_vector_distribution AS
SELECT 
    CASE WHEN attack_vector = 'ADJACENT_NETWORK' THEN 'ADJACENT' ELSE attack_vector END as label, 
    COUNT(*) as count, 
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM gold.intel_vector_analysis 
WHERE attack_vector IS NOT NULL AND attack_vector != 'UNKNOWN'
GROUP BY 1;

CREATE OR REPLACE VIEW gold.v_vector_annual_trend AS
SELECT published_year as pub_year, 
       COUNT(*) FILTER (WHERE attack_vector = 'NETWORK') as network_count,
       COUNT(*) FILTER (WHERE attack_vector IN ('ADJACENT', 'ADJACENT_NETWORK')) as adjacent_count,
       COUNT(*) FILTER (WHERE attack_vector = 'LOCAL') as local_count,
       COUNT(*) FILTER (WHERE attack_vector = 'PHYSICAL') as physical_count, 
       COUNT(*) as total_count
FROM gold.intel_vector_analysis 
WHERE published_year >= 1970 AND attack_vector IS NOT NULL AND attack_vector != 'UNKNOWN'
GROUP BY published_year;

-- [3.4] Source Calculation Views
CREATE OR REPLACE VIEW gold.v_source_distribution AS
WITH base_stats AS (
    SELECT 'Official CVEs (NVD)' as label, COUNT(*) as count FROM silver.cve_vulnerabilities
    UNION ALL
    SELECT 'Open-Source Intel (OSV)' as label, COUNT(*) as count FROM silver.osv_vulnerabilities WHERE id NOT LIKE 'CVE-%' AND id NOT LIKE 'MAL-%'
    UNION ALL
    SELECT 'Malicious Threats (MAL)' as label, COUNT(*) as count FROM silver.osv_vulnerabilities WHERE id LIKE 'MAL-%'
)
SELECT label, count, ROUND(count * 100.0 / SUM(count) OVER(), 2) as percentage FROM base_stats
UNION ALL
SELECT 'Total Intelligence' as label, SUM(count) as count, 100.00 as percentage FROM base_stats;

CREATE OR REPLACE VIEW gold.v_source_annual_trend AS
WITH yearly_data AS (
    SELECT EXTRACT(YEAR FROM published)::INT as pub_year, 'Official CVEs (NVD)' as source FROM silver.cve_vulnerabilities WHERE published IS NOT NULL
    UNION ALL
    SELECT EXTRACT(YEAR FROM (
               CASE 
                   WHEN published < '1970-01-01' OR published IS NULL THEN 
                       COALESCE(
                           (NULLIF(SUBSTRING(id FROM '(19[0-9]{2}|20[0-9]{2})'), '') || '-01-01')::DATE, 
                           modified
                       )
                   ELSE published 
               END
           ))::INT as pub_year, 
           CASE WHEN id LIKE 'MAL-%' THEN 'Malicious Threats (MAL)' ELSE 'Open-Source Intel (OSV)' END as source
    FROM silver.osv_vulnerabilities WHERE id NOT LIKE 'CVE-%'
)
SELECT pub_year, COUNT(*) FILTER (WHERE source = 'Official CVEs (NVD)') as nvd_count,
       COUNT(*) FILTER (WHERE source = 'Open-Source Intel (OSV)') as osv_count,
       COUNT(*) FILTER (WHERE source = 'Malicious Threats (MAL)') as mal_count, COUNT(*) as total_count
FROM yearly_data WHERE pub_year >= 1970 GROUP BY pub_year;

-- [3.5] Ecosystem Calculation Views
CREATE OR REPLACE VIEW gold.v_ecosystem_distribution AS
WITH base_counts AS (
    SELECT SPLIT_PART(ecosystem, ':', 1) as ecosystem, COUNT(DISTINCT osv_id) as count
    FROM silver.osv_affected
    WHERE ecosystem IS NOT NULL AND ecosystem != ''
    GROUP BY 1
)
SELECT ecosystem, count, ROUND(count * 100.0 / SUM(count) OVER(), 2) as percentage
FROM base_counts;

CREATE OR REPLACE VIEW gold.v_ecosystem_annual_trend AS
SELECT 
    EXTRACT(YEAR FROM (
        CASE 
            WHEN v.published < '1970-01-01' OR v.published IS NULL THEN 
                COALESCE(
                    (NULLIF(SUBSTRING(v.id FROM '(19[0-9]{2}|20[0-9]{2})'), '') || '-01-01')::DATE, 
                    v.modified
                )
            ELSE v.published 
        END
    ))::INT as pub_year,
    SPLIT_PART(a.ecosystem, ':', 1) as ecosystem,
    COUNT(DISTINCT a.osv_id) as count
FROM silver.osv_affected a
JOIN silver.osv_vulnerabilities v ON a.osv_id = v.id
WHERE a.ecosystem IS NOT NULL AND a.ecosystem != ''
  AND (v.published >= '1970-01-01' OR v.modified >= '1970-01-01' OR v.id ~ '(19[0-9]{2}|20[0-9]{2})')
GROUP BY 1, 2;

-- [3.6] Weakness Calculation Views
CREATE OR REPLACE VIEW gold.v_weakness_detail_stats AS
WITH base_counts AS (
    SELECT 
        w.cwe_id, 
        COALESCE(d.name, 'Unclassified Weakness') as name,
        COALESCE(d.pillar, 'Others & Unclassified') as pillar,
        COUNT(*) as count
    FROM silver.cve_weaknesses w
    LEFT JOIN gold.cwe_definitions d ON w.cwe_id = d.cwe_id
    WHERE w.cwe_id IS NOT NULL AND w.cwe_id != '' 
      AND w.cwe_id NOT IN ('NVD-CWE-noinfo', 'NVD-CWE-Other')
    GROUP BY 1, 2, 3
)
SELECT 
    cwe_id, name, pillar, count,
    ROUND(count * 100.0 / SUM(count) OVER(), 2) as percentage
FROM base_counts;

CREATE OR REPLACE VIEW gold.v_weakness_pillar_stats AS
SELECT 
    pillar, 
    SUM(count) as count,
    ROUND(SUM(count) * 100.0 / SUM(SUM(count)) OVER(), 2) as percentage
FROM gold.v_weakness_detail_stats
GROUP BY 1;

-- [3.7] 통합 조치 상태 분석 뷰 (Remediation Analysis Core)
CREATE OR REPLACE VIEW gold.v_remediation_analysis AS
WITH unified_base AS (
    SELECT 
        v.id,
        EXTRACT(YEAR FROM v.published)::INT as pub_year,
        v.vuln_status,
        v.evaluator_solution,
        v.cisa_required_action,
        NULL as withdrawn,
        NULL::BOOLEAN as false_positive,
        (SELECT jsonb_agg(r.tags) FROM silver.cve_references r WHERE r.cve_id = v.id) as ref_tags,
        (SELECT string_agg(r.url, ' ') FROM silver.cve_references r WHERE r.cve_id = v.id) as ref_urls,
        (SELECT string_agg(d.value, ' ') FROM silver.cve_descriptions d WHERE d.cve_id = v.id) as descriptions,
        EXISTS (SELECT 1 FROM silver.cve_tags t WHERE t.cve_id = v.id AND t.tag = 'unsupported-when-assigned') as is_eol_tag,
        EXISTS (SELECT 1 FROM silver.cve_vendor_comments vc WHERE vc.cve_id = v.id) as has_vendor_comment,
        EXISTS (
            SELECT 1 FROM silver.cve_configurations c, jsonb_array_elements(c.nodes) n, jsonb_array_elements(n->'cpeMatch') m
            WHERE c.cve_id = v.id AND m ? 'versionEndExcluding'
        ) as has_version_boundary
    FROM silver.cve_vulnerabilities v
    UNION ALL
    SELECT 
        o.id,
        EXTRACT(YEAR FROM (CASE WHEN o.published < '1970-01-01' OR o.published IS NULL THEN o.modified ELSE o.published END))::INT as pub_year,
        NULL as vuln_status,
        NULL as evaluator_solution,
        NULL as cisa_required_action,
        o.withdrawn,
        (o.database_specific->>'false_positive')::BOOLEAN as false_positive,
        NULL as ref_tags,
        (SELECT string_agg(r.url, ' ') FROM silver.osv_references r WHERE r.osv_id = o.id) as ref_urls,
        COALESCE(o.summary, '') || ' ' || COALESCE(o.details, '') as descriptions,
        (o.database_specific->>'informational')::text = 'unmaintained' as is_eol_tag,
        FALSE as has_vendor_comment,
        EXISTS (SELECT 1 FROM silver.osv_credits cr WHERE cr.osv_id = o.id AND cr.type = 'REMEDIATION_DEVELOPER') 
           OR EXISTS (SELECT 1 FROM silver.osv_affected a WHERE a.osv_id = o.id AND a.ecosystem_specific->'fixes' IS NOT NULL AND jsonb_array_length(a.ecosystem_specific->'fixes') > 0) as has_version_boundary
    FROM silver.osv_vulnerabilities o
    WHERE o.id NOT LIKE 'CVE-%' AND o.id NOT LIKE 'MAL-%' -- 악성코드(MAL) 데이터 분석 제외
)
SELECT 
    id,
    pub_year,
    CASE 
        -- ⑥ [Invalid] (분석 제외 - Rejected, Withdrawn, FP)
        WHEN withdrawn IS NOT NULL 
          OR vuln_status IN ('Rejected', 'Deferred') 
          OR false_positive = TRUE
          THEN 'Invalid'
        
        -- ① [Patch Ready] (즉시 해결 가능 - Evidence Based)
        WHEN (
            ref_tags::text ILIKE ANY (ARRAY['%"Patch"%', '%"Vendor Advisory"%', '%"Release Notes"%']) 
            OR ref_urls ILIKE ANY (ARRAY['%/commit/%', '%/patch/%', '%/pull/%', '%/fix/%'])
            OR (evaluator_solution ILIKE ANY (ARRAY['%upgrade%', '%update%', '%fixed in%', '%patch%', '%install%', '%remediate%']) 
                AND evaluator_solution NOT ILIKE ANY (ARRAY['%no fix%', '%not fixed%', '%no solution%', '%no plan%', '%unfixed%', '%awaiting fix%', '%not yet%', '%fix is pending%']))
            OR has_version_boundary = TRUE
            OR EXISTS (SELECT 1 FROM silver.osv_vulnerabilities ov WHERE ov.id = unified_base.id AND (ov.database_specific->>'patched')::boolean = true)
            OR EXISTS (SELECT 1 FROM silver.osv_affected a WHERE a.osv_id = unified_base.id AND a.ranges::text LIKE '%"fixed"%')
        ) THEN 'Patch Ready'
        
        -- ③ [End of Life] (지원 종료)
        WHEN (
            is_eol_tag = TRUE
            OR descriptions ILIKE ANY (ARRAY['%End of Life%', '%EOL%', '%unsupported%', '%no longer maintained%'])
        ) THEN 'End of Life'
        
        -- ② [Solution Provided] (임시 조치 가능)
        WHEN (
            (evaluator_solution IS NOT NULL 
             AND evaluator_solution ILIKE ANY (ARRAY['%upgrade%', '%update%', '%fixed in%', '%patch%', '%install%', '%remediate%'])
             AND evaluator_solution NOT ILIKE ANY (ARRAY['%no fix%', '%not fixed%', '%no solution%', '%no plan%', '%unfixed%', '%awaiting fix%', '%not yet%', '%fix is pending%']))
            OR cisa_required_action IS NOT NULL 
            OR ref_tags::text ILIKE ANY (ARRAY['%"Mitigation"%', '%"Advisory"%', '%"Third Party Advisory"%'])
            OR has_vendor_comment = TRUE
        ) THEN 'Solution Provided'

        -- ④ [Awaiting Patch] (벤더 패치 대기)
        WHEN vuln_status IN ('Analyzed', 'Modified') THEN 'Pending'
        
        -- ⑤ [Unpatched] (미해결 위협)
        ELSE 'Unpatched'
    END as remediation_status
FROM unified_base
WHERE pub_year >= 1970;

CREATE OR REPLACE VIEW gold.v_remediation_distribution AS
SELECT remediation_status as label, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM gold.v_remediation_analysis GROUP BY 1;

CREATE OR REPLACE VIEW gold.v_remediation_annual_trend AS
SELECT pub_year, remediation_status as label, COUNT(*) as count
FROM gold.v_remediation_analysis GROUP BY 1, 2;

-- [3.8] KEV Intelligence Calculation View
CREATE OR REPLACE VIEW gold.v_latest_kev_insights AS
WITH kev_top15 AS (
    SELECT 
        v.id AS cve_id,
        v.cisa_vulnerability_name AS name,
        v.cisa_exploit_add AS added_date,
        v.cisa_action_due AS due_date,
        (v.cisa_action_due - CURRENT_DATE) AS d_day
    FROM silver.cve_vulnerabilities v
    WHERE v.cisa_exploit_add IS NOT NULL
    ORDER BY v.cisa_exploit_add DESC, v.published DESC
    LIMIT 12
)
SELECT 
    k.cve_id,
    k.name,
    (SELECT m.base_score FROM silver.cve_metrics m 
     WHERE m.cve_id = k.cve_id 
     ORDER BY m.cvss_version DESC, m.type = 'Primary' DESC LIMIT 1) AS base_score,
    k.added_date,
    k.due_date,
    k.d_day,
    COALESCE(
        (SELECT d.pillar FROM silver.cve_weaknesses w 
         JOIN gold.cwe_definitions d ON w.cwe_id = d.cwe_id 
         WHERE w.cve_id = k.cve_id LIMIT 1),
        'Other & Unclassified'
    ) AS weakness_type,
    COALESCE(
        (SELECT r.remediation_status FROM gold.v_remediation_analysis r 
         WHERE r.id = k.cve_id LIMIT 1),
        'Unpatched'
    ) AS remediation_status
FROM kev_top15 k;

-- [3.9] Intel Summary Metric Calculation
CREATE OR REPLACE VIEW gold.v_intel_summary AS
WITH 
daily_metrics AS (
    SELECT COUNT(id) FILTER (WHERE published >= NOW() - INTERVAL '24 hours') as new_discoveries,
           COUNT(id) FILTER (WHERE last_modified >= NOW() - INTERVAL '24 hours') as recent_updates
    FROM (
        SELECT id, published, last_modified FROM silver.cve_vulnerabilities 
        UNION ALL 
        SELECT id, 
               (CASE 
                   WHEN published < '1970-01-01' OR published IS NULL THEN 
                       COALESCE(
                           (NULLIF(SUBSTRING(id FROM '(19[0-9]{2}|20[0-9]{2})'), '') || '-01-01')::DATE, 
                           modified
                       )
                   ELSE published 
               END) as published, 
               modified as last_modified 
        FROM silver.osv_vulnerabilities WHERE id NOT LIKE 'CVE-%'
    ) combined_24h
),
span_metrics AS (
    SELECT EXTRACT(YEAR FROM NOW())::INT - EXTRACT(YEAR FROM MIN(published))::INT as span_years
    FROM (
        SELECT published FROM silver.cve_vulnerabilities WHERE published > '1970-01-01' 
        UNION ALL 
        SELECT (CASE 
                   WHEN published < '1970-01-01' OR published IS NULL THEN 
                       COALESCE(
                           (NULLIF(SUBSTRING(id FROM '(19[0-9]{2}|20[0-9]{2})'), '') || '-01-01')::DATE, 
                           modified
                       )
                   ELSE published 
               END) as published 
        FROM silver.osv_vulnerabilities WHERE id NOT LIKE 'CVE-%'
    ) all_published
    WHERE published >= '1970-01-01'
),
total_ids_with_mal AS (SELECT id FROM silver.cve_vulnerabilities UNION SELECT id FROM silver.osv_vulnerabilities WHERE id NOT LIKE 'CVE-%')
SELECT (SELECT COUNT(*) FROM total_ids_with_mal)::BIGINT as total_intelligence,
       (SELECT COUNT(*) FROM silver.cve_vulnerabilities WHERE cisa_exploit_add IS NOT NULL)::BIGINT as active_exploits,
       (SELECT COUNT(*) FROM gold.v_unified_severity WHERE severity_label = 'Critical')::BIGINT as critical_weaknesses,
       (SELECT COALESCE(new_discoveries, 0) FROM daily_metrics)::BIGINT as new_discoveries,
       (SELECT COALESCE(recent_updates, 0) FROM daily_metrics)::BIGINT as recent_updates,
       (SELECT COUNT(*) FROM gold.v_remediation_analysis WHERE remediation_status = 'Unpatched')::BIGINT as unpatched_threats,
       (SELECT COUNT(*) FROM silver.cve_vulnerabilities WHERE vuln_status IN ('Awaiting Analysis', 'Undergoing Analysis'))::BIGINT as analysis_backlog,
       (SELECT COALESCE(span_years, 0) FROM span_metrics)::BIGINT as intelligence_span;

-------------------------------------------------------------------------------
-- [PART 3] OSV vector extraction for gold.intel_vector_analysis (server-side)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gold.normalize_cvss_vector(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN raw IS NULL OR btrim(raw) = '' THEN NULL
        WHEN btrim(raw) LIKE 'AV:%' THEN 'CVSS:2.0/' || btrim(raw)
        ELSE btrim(raw)
    END;
$$;

CREATE OR REPLACE FUNCTION gold.cvss_version_from_vector(normalized TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN normalized IS NULL THEN 'UNKNOWN'
        WHEN normalized LIKE '%CVSS:4.0%' THEN '4.0'
        WHEN normalized LIKE '%CVSS:3.1%' THEN '3.1'
        WHEN normalized LIKE '%CVSS:3.0%' THEN '3.0'
        WHEN normalized LIKE '%CVSS:2.0%' OR normalized LIKE 'AV:%' THEN '2.0'
        ELSE 'UNKNOWN'
    END;
$$;

CREATE OR REPLACE FUNCTION gold.cvss_attack_vector_from_vector(normalized TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE substring(normalized FROM 'AV:([NALP])')
        WHEN 'N' THEN 'NETWORK'
        WHEN 'A' THEN 'ADJACENT'
        WHEN 'L' THEN 'LOCAL'
        WHEN 'P' THEN 'PHYSICAL'
        ELSE 'UNKNOWN'
    END;
$$;

CREATE OR REPLACE FUNCTION gold.insert_osv_vector_analysis()
RETURNS BIGINT
LANGUAGE sql
AS $$
    WITH raw_vectors AS (
        SELECT v.id AS vuln_id,
               EXTRACT(YEAR FROM v.published)::INT AS pub_year,
               v.database_specific -> 'cvss' ->> 'vectorString' AS raw
        FROM silver.osv_vulnerabilities v
        WHERE v.database_specific -> 'cvss' ->> 'vectorString' IS NOT NULL
          AND btrim(v.database_specific -> 'cvss' ->> 'vectorString') <> ''

        UNION ALL

        SELECT v.id,
               EXTRACT(YEAR FROM v.published)::INT,
               sev ->> 'score'
        FROM silver.osv_vulnerabilities v
        CROSS JOIN LATERAL jsonb_each(COALESCE(v.database_specific -> 'cves_map', '{}'::jsonb)) AS m(k, val)
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(val -> 'cves', '[]'::jsonb)) AS cve
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(cve -> 'severity', '[]'::jsonb)) AS sev
        WHERE sev ->> 'score' IS NOT NULL
          AND btrim(sev ->> 'score') <> ''

        UNION ALL

        SELECT s.osv_id,
               EXTRACT(YEAR FROM v.published)::INT,
               s.score_string
        FROM silver.osv_severities s
        JOIN silver.osv_vulnerabilities v ON v.id = s.osv_id
        WHERE s.score_string IS NOT NULL
          AND btrim(s.score_string) <> ''

        UNION ALL

        SELECT a.osv_id,
               EXTRACT(YEAR FROM v.published)::INT,
               sev ->> 'score'
        FROM silver.osv_affected a
        JOIN silver.osv_vulnerabilities v ON v.id = a.osv_id
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(a.severity, '[]'::jsonb)) AS sev
        WHERE sev ->> 'score' IS NOT NULL
          AND btrim(sev ->> 'score') <> ''

        UNION ALL

        SELECT a.osv_id,
               EXTRACT(YEAR FROM v.published)::INT,
               a.database_specific -> 'cvss' ->> 'vectorString'
        FROM silver.osv_affected a
        JOIN silver.osv_vulnerabilities v ON v.id = a.osv_id
        WHERE a.database_specific -> 'cvss' ->> 'vectorString' IS NOT NULL
          AND btrim(a.database_specific -> 'cvss' ->> 'vectorString') <> ''

        UNION ALL

        SELECT a.osv_id,
               EXTRACT(YEAR FROM v.published)::INT,
               a.database_specific ->> 'severity'
        FROM silver.osv_affected a
        JOIN silver.osv_vulnerabilities v ON v.id = a.osv_id
        WHERE jsonb_typeof(a.database_specific -> 'severity') = 'string'
          AND a.database_specific ->> 'severity' IS NOT NULL
          AND btrim(a.database_specific ->> 'severity') <> ''
    ),
    normalized AS (
        SELECT DISTINCT
            rv.vuln_id,
            rv.pub_year,
            gold.normalize_cvss_vector(rv.raw) AS full_vector
        FROM raw_vectors rv
        WHERE gold.normalize_cvss_vector(rv.raw) IS NOT NULL
    ),
    inserted AS (
        INSERT INTO gold.intel_vector_analysis (
            vuln_id,
            source_type,
            cvss_version,
            full_vector,
            attack_vector,
            published_year,
            is_primary
        )
        SELECT
            n.vuln_id,
            'OSV',
            gold.cvss_version_from_vector(n.full_vector),
            n.full_vector,
            gold.cvss_attack_vector_from_vector(n.full_vector),
            n.pub_year,
            TRUE
        FROM normalized n
        ON CONFLICT (vuln_id, full_vector) DO NOTHING
        RETURNING 1
    )
    SELECT COUNT(*)::BIGINT FROM inserted;
$$;

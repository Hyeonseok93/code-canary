-- V4__create_master_tables.sql
-- Medallion Architecture: Silver Layer (Refined Master Data)
-- Focus: Unified Master Storage for NVD (CVE) and OSV Ecosystems

CREATE SCHEMA IF NOT EXISTS silver;

-------------------------------------------------------------------------------
-- [PART 1] NVD (CVE) MASTER TABLES
-------------------------------------------------------------------------------

-- [1.1] cve_vulnerabilities (Master Table)
CREATE TABLE IF NOT EXISTS silver.cve_vulnerabilities (
    id VARCHAR(30) PRIMARY KEY,                    -- CVE-ID
    source_identifier VARCHAR(100),                -- 발행 기관
    published TIMESTAMPTZ NOT NULL,                  -- 발행일
    last_modified TIMESTAMPTZ NOT NULL,              -- 최종 수정일
    vuln_status VARCHAR(50),                       -- 취약점 상태

    -- 평가 정보
    evaluator_solution TEXT,                       -- 해결책 설명
    evaluator_impact TEXT,                         -- 영향도 설명
    evaluator_comment TEXT,                        -- 평가 의견

    -- CISA KEV 정보
    cisa_exploit_add DATE,                         -- KEV 추가일
    cisa_action_due DATE,                          -- 대응 기한일
    cisa_required_action TEXT,                     -- 권고 조치 설명
    cisa_vulnerability_name TEXT,                  -- 취약점 공식 명칭

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_silver_cve_published ON silver.cve_vulnerabilities(published);
CREATE INDEX IF NOT EXISTS idx_silver_cve_status ON silver.cve_vulnerabilities(vuln_status);
CREATE INDEX IF NOT EXISTS idx_silver_cve_cisa_action ON silver.cve_vulnerabilities(cisa_action_due) WHERE cisa_action_due IS NOT NULL;

-- [1.2] cve_descriptions
CREATE TABLE IF NOT EXISTS silver.cve_descriptions (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    lang VARCHAR(10),                             -- 언어 코드
    value TEXT                                    -- 설명 본문
);
CREATE INDEX IF NOT EXISTS idx_silver_desc_cve_id ON silver.cve_descriptions(cve_id);

-- [1.3] cve_weaknesses
CREATE TABLE IF NOT EXISTS silver.cve_weaknesses (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    source VARCHAR(100),                          -- 정보 제공 기관
    type VARCHAR(30),                             -- 분석 유형
    cwe_id VARCHAR(30)                            -- CWE 식별 번호
);
CREATE INDEX IF NOT EXISTS idx_silver_weak_cve_id ON silver.cve_weaknesses(cve_id);
CREATE INDEX IF NOT EXISTS idx_silver_weak_cwe_id ON silver.cve_weaknesses(cwe_id);

-- [1.4] cve_references
CREATE TABLE IF NOT EXISTS silver.cve_references (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    url TEXT,                                     -- 링크 주소
    source VARCHAR(100),                          -- 정보 출처
    tags JSONB                                    -- 리스트형 태그 통합 보관
);
CREATE INDEX IF NOT EXISTS idx_silver_ref_cve_id ON silver.cve_references(cve_id);
CREATE INDEX IF NOT EXISTS idx_silver_ref_tags ON silver.cve_references USING GIN (tags);

-- [1.5] cve_vendor_comments
CREATE TABLE IF NOT EXISTS silver.cve_vendor_comments (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    organization VARCHAR(200),                    -- 벤더 조직명
    comment TEXT,                                 -- 코멘트 본문
    last_modified TIMESTAMPTZ                       -- 코멘트 수정일
);
CREATE INDEX IF NOT EXISTS idx_silver_vc_cve_id ON silver.cve_vendor_comments(cve_id);

-- [1.6] cve_tags
CREATE TABLE IF NOT EXISTS silver.cve_tags (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    source_identifier VARCHAR(100),                -- 태그 출처
    tag VARCHAR(100)                              -- 태그 값
);
CREATE INDEX IF NOT EXISTS idx_silver_tags_cve_id ON silver.cve_tags(cve_id);

-- [1.7] cve_metrics (Integrated Metrics)
CREATE TABLE IF NOT EXISTS silver.cve_metrics (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    cvss_version VARCHAR(10),                     -- 버전 식별
    source VARCHAR(100),                          -- 평가 기관
    type VARCHAR(20),                             -- 데이터 성격
    
    vector_string VARCHAR(200),                   -- CVSS 벡터
    base_score NUMERIC(3,1),                      -- 최종 점수
    base_severity VARCHAR(20),                    -- 심각도 등급

    attack_vector VARCHAR(50),                    -- 통합: accessVector ↔ attackVector
    attack_complexity VARCHAR(50),                -- 통합: accessComplexity ↔ attackComplexity
    user_interaction VARCHAR(50),                 -- 통합: userInteractionRequired ↔ userInteraction

    cvss_data JSONB,                              -- 버전별 상세 지표
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_silver_metrics_cve_id ON silver.cve_metrics(cve_id);
CREATE INDEX IF NOT EXISTS idx_silver_metrics_score ON silver.cve_metrics(base_score);
CREATE INDEX IF NOT EXISTS idx_silver_metrics_vector ON silver.cve_metrics(attack_vector);
CREATE INDEX IF NOT EXISTS idx_silver_metrics_interaction ON silver.cve_metrics(user_interaction);

-- [1.8] cve_configurations
CREATE TABLE IF NOT EXISTS silver.cve_configurations (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL REFERENCES silver.cve_vulnerabilities(id) ON DELETE CASCADE,
    nodes JSONB,                                  -- 복합 노드 정보
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_silver_configs_cve_id ON silver.cve_configurations(cve_id);
CREATE INDEX IF NOT EXISTS idx_silver_configs_nodes_gin ON silver.cve_configurations USING GIN (nodes);

-------------------------------------------------------------------------------
-- [PART 2] OSV MASTER TABLES
-------------------------------------------------------------------------------

-- [2.1] osv_vulnerabilities (Master Table)
CREATE TABLE IF NOT EXISTS silver.osv_vulnerabilities (
    id VARCHAR(100) PRIMARY KEY,                  -- OSV ID
    schema_version VARCHAR(20),                   -- 데이터 규격 버전
    published TIMESTAMPTZ,                          -- 발행 시각
    modified TIMESTAMPTZ NOT NULL,                  -- 최종 수정 시각
    withdrawn TIMESTAMPTZ,                          -- 철회 시각
    summary TEXT,                                 -- 요약 설명
    details TEXT,                                 -- 상세 본문
    database_specific JSONB,                      -- 고유 확장 정보
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_silver_osv_published ON silver.osv_vulnerabilities(published);
CREATE INDEX IF NOT EXISTS idx_silver_osv_modified ON silver.osv_vulnerabilities(modified);
CREATE INDEX IF NOT EXISTS idx_silver_osv_withdrawn ON silver.osv_vulnerabilities(withdrawn) WHERE withdrawn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_silver_osv_db_spec_gin ON silver.osv_vulnerabilities USING GIN (database_specific);

-- [2.2] osv_identifiers
CREATE TABLE IF NOT EXISTS silver.osv_identifiers (
    id BIGSERIAL PRIMARY KEY,
    osv_id VARCHAR(100) NOT NULL REFERENCES silver.osv_vulnerabilities(id) ON DELETE CASCADE,
    id_type VARCHAR(30) NOT NULL,                 -- 'ALIAS', 'RELATED', 'UPSTREAM'
    target_id VARCHAR(100) NOT NULL               -- 외부 ID값
);
CREATE INDEX IF NOT EXISTS idx_silver_osv_id_target ON silver.osv_identifiers(target_id);
CREATE INDEX IF NOT EXISTS idx_silver_osv_id_parent ON silver.osv_identifiers(osv_id);

-- [2.3] osv_references
CREATE TABLE IF NOT EXISTS silver.osv_references (
    id BIGSERIAL PRIMARY KEY,
    osv_id VARCHAR(100) NOT NULL REFERENCES silver.osv_vulnerabilities(id) ON DELETE CASCADE,
    type VARCHAR(50),                             -- 링크 유형
    url TEXT                                      -- 링크 주소
);
CREATE INDEX IF NOT EXISTS idx_silver_osv_ref_parent ON silver.osv_references(osv_id);

-- [2.4] osv_severities
CREATE TABLE IF NOT EXISTS silver.osv_severities (
    id BIGSERIAL PRIMARY KEY,
    osv_id VARCHAR(100) NOT NULL REFERENCES silver.osv_vulnerabilities(id) ON DELETE CASCADE,
    type VARCHAR(30),                             -- CVSS 체계 구분
    score_string VARCHAR(255)                     -- 벡터 및 점수 문자열
);
CREATE INDEX IF NOT EXISTS idx_silver_osv_sev_parent ON silver.osv_severities(osv_id);

-- [2.5] osv_credits
CREATE TABLE IF NOT EXISTS silver.osv_credits (
    id BIGSERIAL PRIMARY KEY,
    osv_id VARCHAR(100) NOT NULL REFERENCES silver.osv_vulnerabilities(id) ON DELETE CASCADE,
    name TEXT,                                    -- 제보자 성함
    type VARCHAR(50),                             -- 기여 유형
    contacts JSONB                                -- 연락처 정보
);
CREATE INDEX IF NOT EXISTS idx_silver_osv_credit_parent ON silver.osv_credits(osv_id);

-- [2.6] osv_affected (Affected Packages & Versions)
CREATE TABLE IF NOT EXISTS silver.osv_affected (
    id BIGSERIAL PRIMARY KEY,
    osv_id VARCHAR(100) NOT NULL REFERENCES silver.osv_vulnerabilities(id) ON DELETE CASCADE,
    
    -- 패키지 식별
    package_name VARCHAR(255),                    -- 패키지 명칭
    ecosystem VARCHAR(100),                       -- 생태계 (npm, PyPI 등)
    purl TEXT,                                    -- Package URL
    
    -- 가변적/복합 데이터
    ranges JSONB,                                 -- 버전 범위 정보
    versions JSONB,                               -- 개별 버전 리스트
    severity JSONB,                               -- 패키지별 특수 점수
    database_specific JSONB,                      -- 확장 정보
    ecosystem_specific JSONB,                     -- 생태계별 메타데이터
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_silver_osv_aff_parent ON silver.osv_affected(osv_id);
CREATE INDEX IF NOT EXISTS idx_silver_osv_aff_pkg ON silver.osv_affected(package_name);
CREATE INDEX IF NOT EXISTS idx_silver_osv_aff_eco ON silver.osv_affected(ecosystem);
CREATE INDEX IF NOT EXISTS idx_silver_osv_aff_purl ON silver.osv_affected(purl);
CREATE INDEX IF NOT EXISTS idx_silver_osv_aff_ranges_gin ON silver.osv_affected USING GIN (ranges);

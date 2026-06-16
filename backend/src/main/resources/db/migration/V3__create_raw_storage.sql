-- V3__create_raw_storage.sql
-- Medallion Architecture: Bronze Layer (Raw Data Storage)
-- Specification based on docs/V0__create_raw_storage.md

CREATE SCHEMA IF NOT EXISTS bronze;

-- [1] 원본 취약점 데이터 스테이징 테이블
CREATE TABLE IF NOT EXISTS bronze.raw_vulnerability_data (
    id BIGSERIAL PRIMARY KEY,                      -- 시스템 관리용 고유 PK
    vulnerability_id VARCHAR(100) NOT NULL,        -- CVE-ID 또는 OSV-ID
    source_type VARCHAR(20) NOT NULL,              -- 'NVD' 또는 'OSV'
    raw_content JSONB NOT NULL,                    -- 원본 데이터를 그대로 보관
    content_hash CHAR(64),                         -- Load diff: SHA-256 hex of canonical JSON (sort_keys)

    processed_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSED, ERROR
    error_count INTEGER DEFAULT 0,                 -- 정제 실패 횟수 (재시도 로직용)
    last_error_message TEXT,                       -- 최종 에러 상세 내용
    
    first_collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- 최초 유입 시각
    last_collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- 최종 업데이트 시각 (Upsert 시 갱신)

    -- Upsert 지원: (source_type, vulnerability_id) 유니크 제약 조건
    CONSTRAINT unique_source_vulnerability UNIQUE (source_type, vulnerability_id)
);

-- 인덱스 설계
CREATE INDEX IF NOT EXISTS idx_bronze_raw_vuln_id ON bronze.raw_vulnerability_data(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_bronze_raw_source ON bronze.raw_vulnerability_data(source_type);
CREATE INDEX IF NOT EXISTS idx_bronze_raw_status ON bronze.raw_vulnerability_data(processed_status);
CREATE INDEX IF NOT EXISTS idx_bronze_raw_content_gin ON bronze.raw_vulnerability_data USING GIN (raw_content);

-- [핵심] 정제 대상 선별용 부분 인덱스 (Silver refinery 배치 성능)
CREATE INDEX IF NOT EXISTS idx_bronze_raw_to_process ON bronze.raw_vulnerability_data(processed_status) 
WHERE processed_status IN ('PENDING', 'ERROR');

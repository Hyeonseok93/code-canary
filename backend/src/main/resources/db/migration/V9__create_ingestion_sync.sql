-- V9__create_ingestion_sync.sql
-- Precomputed ingestion pipeline timestamps for admin sync display.
-- Incremental NVD collect uses last_collected_at (collect start) minus overlap.

CREATE TABLE IF NOT EXISTS gold.ingestion_sync (
    source_type VARCHAR(20) PRIMARY KEY,
    last_collected_at TIMESTAMPTZ,
    records_touched BIGINT DEFAULT 0,
    last_silver_refined_at TIMESTAMPTZ,
    last_gold_refreshed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'idle',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gold.ingestion_sync (source_type, last_collected_at, records_touched, status)
SELECT
    'NVD',
    MAX(last_collected_at),
    COUNT(*),
    'idle'
FROM bronze.raw_vulnerability_data
WHERE source_type = 'NVD'
ON CONFLICT (source_type) DO UPDATE SET
    last_collected_at = EXCLUDED.last_collected_at,
    records_touched = EXCLUDED.records_touched,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO gold.ingestion_sync (source_type, last_collected_at, records_touched, status)
SELECT
    'OSV',
    MAX(last_collected_at),
    COUNT(*),
    'idle'
FROM bronze.raw_vulnerability_data
WHERE source_type = 'OSV'
ON CONFLICT (source_type) DO UPDATE SET
    last_collected_at = EXCLUDED.last_collected_at,
    records_touched = EXCLUDED.records_touched,
    updated_at = CURRENT_TIMESTAMP;

-- V2__create_pipeline_jobs.sql
-- Admin-triggered pipeline jobs consumed by the Python worker runner.
-- Includes staging baseline selection (load) and collect mode (NVD full/incremental).

CREATE TABLE IF NOT EXISTS management.pipeline_jobs (
    id BIGSERIAL PRIMARY KEY,
    step_key VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    requested_by VARCHAR(100),
    staging_ref VARCHAR(255),
    collect_mode VARCHAR(20),
    worker_id VARCHAR(100),
    heartbeat_at TIMESTAMPTZ,
    cancel_requested_at TIMESTAMPTZ,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pipeline_jobs_status CHECK (status IN ('queued', 'running', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status_created
    ON management.pipeline_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_running_heartbeat
    ON management.pipeline_jobs (status, heartbeat_at)
    WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_step_key_created
    ON management.pipeline_jobs (step_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_staging_ref
    ON management.pipeline_jobs (staging_ref)
    WHERE staging_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS management.pipeline_job_logs (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES management.pipeline_jobs(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    CONSTRAINT chk_pipeline_job_logs_level CHECK (level IN ('info', 'warn', 'error', 'success'))
);

CREATE INDEX IF NOT EXISTS idx_pipeline_job_logs_job_logged
    ON management.pipeline_job_logs (job_id, logged_at);

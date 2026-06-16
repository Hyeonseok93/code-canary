-- V8: JWT revocation denylist (rate limiting moved to Redis)
-- Requires: V0 (management schema)

CREATE TABLE IF NOT EXISTS management.revoked_tokens (
    jti VARCHAR(36) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at
    ON management.revoked_tokens (expires_at);

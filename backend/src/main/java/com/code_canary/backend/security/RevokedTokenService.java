package com.code_canary.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.Timestamp;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class RevokedTokenService {

    private final JdbcTemplate jdbcTemplate;

    public void revoke(String jti, Date expiresAt) {
        if (!StringUtils.hasText(jti) || expiresAt == null) {
            return;
        }

        jdbcTemplate.update(
                """
                INSERT INTO management.revoked_tokens (jti, expires_at)
                VALUES (?, ?)
                ON CONFLICT (jti) DO NOTHING
                """,
                jti,
                Timestamp.from(expiresAt.toInstant())
        );
    }

    public boolean isRevoked(String jti) {
        if (!StringUtils.hasText(jti)) {
            return false;
        }

        Boolean exists = jdbcTemplate.queryForObject(
                """
                SELECT EXISTS(
                    SELECT 1 FROM management.revoked_tokens
                    WHERE jti = ? AND expires_at > NOW()
                )
                """,
                Boolean.class,
                jti
        );
        return Boolean.TRUE.equals(exists);
    }

    @Scheduled(fixedRateString = "${app.security.jwt.revocation-prune-interval-ms:3600000}")
    public void pruneExpiredEntries() {
        jdbcTemplate.update("DELETE FROM management.revoked_tokens WHERE expires_at <= NOW()");
    }

}

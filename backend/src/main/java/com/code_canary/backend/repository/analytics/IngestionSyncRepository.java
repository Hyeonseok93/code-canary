package com.code_canary.backend.repository.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class IngestionSyncRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> findAll() {
        return jdbcTemplate.queryForList(
                "SELECT source_type, last_collected_at, last_silver_refined_at, "
                        + "last_gold_refreshed_at, status "
                        + "FROM gold.ingestion_sync ORDER BY source_type"
        );
    }

    /**
     * Sets {@code last_collected_at} from staging when the DB row has no collect timestamp
     * (e.g. after {@code docker compose down -v} while host {@code ./data} baselines remain).
     */
    public boolean bootstrapLastCollectedAtIfMissing(String sourceType, LocalDateTime collectedAt) {
        int updated = jdbcTemplate.update(
                """
                UPDATE gold.ingestion_sync
                SET last_collected_at = ?, updated_at = CURRENT_TIMESTAMP
                WHERE source_type = ? AND last_collected_at IS NULL
                """,
                Timestamp.valueOf(collectedAt),
                sourceType
        );
        return updated > 0;
    }

    public boolean markFailedIfRunning(String sourceType) {
        int updated = jdbcTemplate.update(
                """
                UPDATE gold.ingestion_sync
                SET status = 'failed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE source_type = ?
                  AND status = 'running'
                """,
                sourceType
        );
        return updated > 0;
    }
}

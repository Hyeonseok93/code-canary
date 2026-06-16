package com.code_canary.backend.repository.pipeline;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Repository
@RequiredArgsConstructor
public class PipelineJobRepository {

    private final JdbcTemplate jdbcTemplate;

    public long insertJob(String stepKey, String requestedBy, String stagingRef, String collectMode) {
        List<Long> ids = jdbcTemplate.query(
                connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            """
                            INSERT INTO management.pipeline_jobs (step_key, status, requested_by, staging_ref, collect_mode)
                            VALUES (?, 'queued', ?, ?, ?)
                            RETURNING id
                            """
                    );
                    ps.setString(1, stepKey);
                    ps.setString(2, requestedBy);
                    if (stagingRef == null) {
                        ps.setNull(3, Types.VARCHAR);
                    } else {
                        ps.setString(3, stagingRef);
                    }
                    if (collectMode == null) {
                        ps.setNull(4, Types.VARCHAR);
                    } else {
                        ps.setString(4, collectMode);
                    }
                    return ps;
                },
                (rs, rowNum) -> rs.getLong("id")
        );

        if (ids.isEmpty()) {
            throw new IllegalStateException("Failed to insert pipeline job");
        }
        return ids.getFirst();
    }

    public boolean hasActiveJob(int staleMinutes) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM management.pipeline_jobs
                WHERE status = 'queued'
                   OR (
                        status = 'running'
                        AND COALESCE(heartbeat_at, started_at, created_at)
                            > CURRENT_TIMESTAMP - make_interval(mins => ?)
                   )
                """,
                Integer.class,
                staleMinutes
        );
        return count != null && count > 0;
    }

    public List<Map<String, Object>> reclaimStaleRunningJobs(int staleMinutes, String errorMessage) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                UPDATE management.pipeline_jobs
                SET status = 'failed',
                    finished_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    error_message = ?
                WHERE status = 'running'
                  AND COALESCE(heartbeat_at, started_at, created_at)
                      < CURRENT_TIMESTAMP - make_interval(mins => ?)
                RETURNING id, step_key
                """,
                truncateError(errorMessage),
                staleMinutes
        );
        for (Map<String, Object> row : rows) {
            appendJobLog(((Number) row.get("id")).longValue(), "error", errorMessage);
        }
        return rows;
    }

    public List<Map<String, Object>> failAllRunningJobs(String errorMessage) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                UPDATE management.pipeline_jobs
                SET status = 'failed',
                    finished_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    error_message = ?
                WHERE status = 'running'
                RETURNING id, step_key
                """,
                truncateError(errorMessage)
        );
        for (Map<String, Object> row : rows) {
            appendJobLog(((Number) row.get("id")).longValue(), "error", errorMessage);
        }
        return rows;
    }

    public Map<String, Object> findActiveJobByStepKey(String stepKey) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT id, step_key, status
                FROM management.pipeline_jobs
                WHERE step_key = ?
                  AND status IN ('queued', 'running')
                ORDER BY created_at DESC
                LIMIT 1
                """,
                stepKey
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public boolean failQueuedJob(long jobId, String errorMessage) {
        List<Long> ids = jdbcTemplate.query(
                connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            """
                            UPDATE management.pipeline_jobs
                            SET status = 'failed',
                                finished_at = CURRENT_TIMESTAMP,
                                updated_at = CURRENT_TIMESTAMP,
                                error_message = ?
                            WHERE id = ?
                              AND status = 'queued'
                            RETURNING id
                            """
                    );
                    ps.setString(1, truncateError(errorMessage));
                    ps.setLong(2, jobId);
                    return ps;
                },
                (rs, rowNum) -> rs.getLong("id")
        );
        if (!ids.isEmpty()) {
            appendJobLog(jobId, "error", errorMessage);
        }
        return !ids.isEmpty();
    }

    public boolean requestCancelRunningJob(long jobId) {
        List<Long> ids = jdbcTemplate.query(
                connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            """
                            UPDATE management.pipeline_jobs
                            SET cancel_requested_at = CURRENT_TIMESTAMP,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                              AND status = 'running'
                              AND cancel_requested_at IS NULL
                            RETURNING id
                            """
                    );
                    ps.setLong(1, jobId);
                    return ps;
                },
                (rs, rowNum) -> rs.getLong("id")
        );
        return !ids.isEmpty();
    }

    public void appendJobLog(long jobId, String level, String message) {
        String normalizedLevel = level == null ? "info" : level.toLowerCase();
        if (!List.of("info", "warn", "error", "success").contains(normalizedLevel)) {
            normalizedLevel = "info";
        }
        jdbcTemplate.update(
                """
                INSERT INTO management.pipeline_job_logs (job_id, level, message)
                VALUES (?, ?, ?)
                """,
                jobId,
                normalizedLevel,
                message == null ? "" : message.substring(0, Math.min(message.length(), 4000))
        );
    }

    private static String truncateError(String errorMessage) {
        if (errorMessage == null) {
            return null;
        }
        return errorMessage.length() <= 2000 ? errorMessage : errorMessage.substring(0, 2000);
    }

    public List<Map<String, Object>> findLatestJobsByStepKeys(List<String> stepKeys) {
        if (stepKeys.isEmpty()) {
            return List.of();
        }

        String placeholders = String.join(", ", stepKeys.stream().map(k -> "?").toList());
        String sql = Objects.requireNonNull("""
                SELECT DISTINCT ON (step_key)
                    id,
                    step_key,
                    status,
                    requested_by,
                    error_message,
                    started_at,
                    finished_at,
                    created_at
                FROM management.pipeline_jobs
                WHERE step_key IN (%s)
                ORDER BY step_key, created_at DESC
                """.formatted(placeholders));
        return jdbcTemplate.queryForList(sql, stepKeys.toArray());
    }

    public List<Map<String, Object>> findRecentActivityLogs(int limit) {
        return jdbcTemplate.queryForList(
                """
                SELECT
                    l.id,
                    l.logged_at,
                    l.level,
                    j.step_key,
                    l.message
                FROM management.pipeline_job_logs l
                JOIN management.pipeline_jobs j ON j.id = l.job_id
                ORDER BY l.logged_at DESC
                LIMIT ?
                """,
                limit
        );
    }

    public static Long durationSeconds(Map<String, Object> jobRow) {
        Object started = jobRow.get("started_at");
        Object finished = jobRow.get("finished_at");
        if (!(started instanceof Timestamp startedAt) || !(finished instanceof Timestamp finishedAt)) {
            return null;
        }
        long seconds = finishedAt.toInstant().getEpochSecond() - startedAt.toInstant().getEpochSecond();
        return seconds >= 0 ? seconds : null;
    }

    public static String timestampToIso(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.toInstant().toString();
        }
        if (value instanceof Instant instant) {
            return instant.toString();
        }
        return value == null ? null : value.toString();
    }

    public static String errorMessageOrNull(Map<String, Object> jobRow) {
        if (jobRow == null) {
            return null;
        }
        Object value = jobRow.get("error_message");
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }
}

package com.code_canary.backend.service;

import com.code_canary.backend.constants.PipelineStepKeys;
import com.code_canary.backend.dto.PipelineDto;
import com.code_canary.backend.repository.pipeline.PipelineJobRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Merges {@code gold.ingestion_sync} rows with {@code management.pipeline_jobs} for a single source-of-truth view.
 */
public final class PipelineSyncResolver {

    private PipelineSyncResolver() {
    }

    public static Map<String, Map<String, Object>> indexLatestJobs(List<Map<String, Object>> rows) {
        return rows.stream()
                .collect(Collectors.toMap(
                        row -> String.valueOf(row.get("step_key")),
                        Function.identity(),
                        (left, right) -> left
                ));
    }

    public static Map<String, Object> rowForSource(List<Map<String, Object>> rows, String sourceType) {
        return rows.stream()
                .filter(row -> sourceType.equalsIgnoreCase(String.valueOf(row.get("source_type"))))
                .findFirst()
                .orElse(Map.of());
    }

    public static List<PipelineDto.StepStatus> buildSourceSteps(
            List<String> stepKeys,
            Map<String, Map<String, Object>> latestJobs,
            Map<String, Object> syncRow
    ) {
        List<PipelineDto.StepStatus> steps = new ArrayList<>();
        for (String stepKey : stepKeys) {
            steps.add(buildStepStatus(stepKey, latestJobs.get(stepKey), syncRow));
        }
        return steps;
    }

    public static String resolveSourceStatus(Map<String, Object> syncRow, List<PipelineDto.StepStatus> steps) {
        for (PipelineDto.StepStatus step : steps) {
            if ("running".equals(step.status())) {
                return "running";
            }
            if ("pending".equals(step.status())) {
                return "pending";
            }
        }

        String ingestionStatus = syncRow.get("status") == null ? "idle" : syncRow.get("status").toString();
        if ("running".equals(ingestionStatus) || "failed".equals(ingestionStatus)) {
            return ingestionStatus;
        }
        return "idle";
    }

    public static String resolveSyncStartedAt(
            Map<String, Object> syncRow,
            Map<String, Map<String, Object>> latestJobs,
            String collectStepKey
    ) {
        Map<String, Object> collectJob = latestJobs.get(collectStepKey);
        if (collectJob != null) {
            String rawStatus = String.valueOf(collectJob.get("status"));
            if ("running".equals(rawStatus) || "queued".equals(rawStatus)) {
                Object timestamp = collectJob.get("started_at");
                if (timestamp == null) {
                    timestamp = collectJob.get("created_at");
                }
                if (timestamp != null) {
                    return PipelineJobRepository.timestampToIso(timestamp);
                }
            }
        }
        return PipelineJobRepository.timestampToIso(syncRow.get("last_collected_at"));
    }

    public static PipelineDto.StepStatus buildStepStatus(
            String stepKey,
            Map<String, Object> jobRow,
            Map<String, Object> syncRow
    ) {
        if (jobRow == null) {
            if (isSilverStep(stepKey)) {
                String silverAt = PipelineJobRepository.timestampToIso(syncRow.get("last_silver_refined_at"));
                if (silverAt != null) {
                    return new PipelineDto.StepStatus(stepKey, "success", silverAt, null, null, null);
                }
            }
            return new PipelineDto.StepStatus(stepKey, "idle", null, null, null, null);
        }

        String mappedStatus = mapJobStatus(String.valueOf(jobRow.get("status")));
        return new PipelineDto.StepStatus(
                stepKey,
                mappedStatus,
                PipelineJobRepository.timestampToIso(
                        jobRow.get("finished_at") != null ? jobRow.get("finished_at") : jobRow.get("started_at")
                ),
                PipelineJobRepository.durationSeconds(jobRow),
                ((Number) jobRow.get("id")).longValue(),
                "failed".equals(mappedStatus) ? PipelineJobRepository.errorMessageOrNull(jobRow) : null
        );
    }

    public static String timestampForColumn(Map<String, Object> syncRow, String column) {
        if (syncRow == null || syncRow.isEmpty()) {
            return null;
        }
        return PipelineJobRepository.timestampToIso(syncRow.get(column));
    }

    public static String latestGoldRefreshedAt(List<Map<String, Object>> syncRows) {
        return syncRows.stream()
                .map(row -> PipelineJobRepository.timestampToIso(row.get("last_gold_refreshed_at")))
                .filter(value -> value != null && !value.isBlank())
                .max(String::compareTo)
                .orElse(null);
    }

    public static String resolveGoldStatus(String lastGold, String jobStatus) {
        if ("running".equals(jobStatus) || "pending".equals(jobStatus) || "failed".equals(jobStatus)) {
            return jobStatus;
        }
        if (lastGold == null) {
            return "idle";
        }
        return "success";
    }

    public static String sourceFromStepKey(String stepKey) {
        if (stepKey.startsWith("nvd-")) {
            return "NVD";
        }
        if (stepKey.startsWith("osv-")) {
            return "OSV";
        }
        return "GOLD";
    }

    public static String collectSourceTypeFromStepKey(String stepKey) {
        return switch (stepKey) {
            case PipelineStepKeys.NVD_COLLECT -> "NVD";
            case PipelineStepKeys.OSV_COLLECT -> "OSV";
            default -> null;
        };
    }

    private static boolean isSilverStep(String stepKey) {
        return PipelineStepKeys.NVD_SILVER.equals(stepKey) || PipelineStepKeys.OSV_SILVER.equals(stepKey);
    }

    public static String mapJobStatus(String jobStatus) {
        return switch (jobStatus) {
            case "queued" -> "pending";
            case "running" -> "running";
            case "success" -> "success";
            case "failed" -> "failed";
            default -> "idle";
        };
    }
}

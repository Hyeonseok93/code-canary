package com.code_canary.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public final class PipelineDto {

    private PipelineDto() {
    }

    public record ReleaseStuckJobsResponse(int releasedCount, List<Long> jobIds) {
    }

    public record StopJobRequest(@NotBlank String stepKey) {
    }

    public record StopJobResponse(long jobId, String stepKey, String action) {
    }

    public record EnqueueJobRequest(@NotBlank String stepKey, String stagingRef, String collectMode) {
    }

    public record StagingBaseline(String id, String label, String modifiedAt, long sizeBytes) {
    }

    public record StagingResponse(List<StagingBaseline> nvd, List<StagingBaseline> osv) {
    }

    public record EnqueueJobResponse(long jobId, String stepKey, String status) {
    }

    public record StepStatus(
            String id,
            String status,
            String lastRunAt,
            Long durationSeconds,
            Long lastJobId,
            String errorMessage
    ) {
    }

    public record SourcePipeline(
            String source,
            String lastCollectedAt,
            String syncStatus,
            long recordsInBronze,
            long pendingSilver,
            long recordsInSilver,
            List<StepStatus> steps
    ) {
    }

    public record GoldSummary(
            String lastRefreshedAt,
            long explorerRows,
            String status,
            String lastRunAt,
            Long durationSeconds,
            Long lastJobId,
            String errorMessage
    ) {
    }

    public record StatusResponse(List<SourcePipeline> sources, GoldSummary gold) {
    }

    public record ActivityLogEntry(
            long id,
            String timestamp,
            String level,
            String source,
            String stepKey,
            String message
    ) {
    }

    public record ActivityLogResponse(List<ActivityLogEntry> entries) {
    }
}

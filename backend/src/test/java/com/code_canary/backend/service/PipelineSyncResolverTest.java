package com.code_canary.backend.service;

import com.code_canary.backend.constants.PipelineStepKeys;
import com.code_canary.backend.dto.PipelineDto;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PipelineSyncResolverTest {

    @Test
    void resolveSourceStatus_prefersRunningStepOverIngestionSync() {
        List<PipelineDto.StepStatus> steps = List.of(
                new PipelineDto.StepStatus(PipelineStepKeys.NVD_COLLECT, "success", null, null, null, null),
                new PipelineDto.StepStatus(PipelineStepKeys.NVD_LOAD, "running", null, null, 42L, null)
        );

        String status = PipelineSyncResolver.resolveSourceStatus(Map.of("status", "idle"), steps);

        assertEquals("running", status);
    }

    @Test
    void resolveSourceStatus_returnsPendingWhenJobQueued() {
        List<PipelineDto.StepStatus> steps = List.of(
                new PipelineDto.StepStatus(PipelineStepKeys.OSV_COLLECT, "pending", null, null, 7L, null)
        );

        assertEquals("pending", PipelineSyncResolver.resolveSourceStatus(Map.of("status", "running"), steps));
    }

    @Test
    void buildStepStatus_exposesErrorMessageForFailedJob() {
        Map<String, Object> jobRow = Map.of(
                "id", 99L,
                "status", "failed",
                "started_at", java.sql.Timestamp.from(java.time.Instant.parse("2026-06-09T10:00:00Z")),
                "error_message", "disk full"
        );

        PipelineDto.StepStatus step = PipelineSyncResolver.buildStepStatus(
                PipelineStepKeys.NVD_LOAD,
                jobRow,
                Map.of()
        );

        assertEquals("failed", step.status());
        assertEquals("disk full", step.errorMessage());
    }

    @Test
    void buildStepStatus_fallsBackToSilverTimestampWhenNoJob() {
        PipelineDto.StepStatus step = PipelineSyncResolver.buildStepStatus(
                PipelineStepKeys.NVD_SILVER,
                null,
                Map.of("last_silver_refined_at", java.sql.Timestamp.from(java.time.Instant.parse("2026-06-09T12:00:00Z")))
        );

        assertEquals("success", step.status());
        assertEquals("2026-06-09T12:00:00Z", step.lastRunAt());
    }

    @Test
    void resolveSyncStartedAt_usesActiveCollectJobStartTime() {
        Map<String, Map<String, Object>> jobs = Map.of(
                PipelineStepKeys.NVD_COLLECT,
                Map.of(
                        "status", "running",
                        "started_at", java.sql.Timestamp.from(java.time.Instant.parse("2026-06-09T08:30:00Z"))
                )
        );

        String startedAt = PipelineSyncResolver.resolveSyncStartedAt(
                Map.of("last_collected_at", java.sql.Timestamp.from(java.time.Instant.parse("2026-06-08T01:00:00Z"))),
                jobs,
                PipelineStepKeys.NVD_COLLECT
        );

        assertEquals("2026-06-09T08:30:00Z", startedAt);
    }

    @Test
    void resolveSyncStartedAt_fallsBackToLastCollectedAt() {
        assertNull(PipelineSyncResolver.resolveSyncStartedAt(Map.of(), Map.of(), PipelineStepKeys.NVD_COLLECT));
    }

    @Test
    void rowForSource_returnsMatchingRow() {
        Map<String, Object> nvd = PipelineSyncResolver.rowForSource(
                List.of(Map.of("source_type", "NVD", "status", "idle")),
                "NVD"
        );

        assertEquals("idle", nvd.get("status"));
    }

    @Test
    void resolveGoldStatus_prefersActiveJobStatus() {
        assertEquals("running", PipelineSyncResolver.resolveGoldStatus("2026-01-01T00:00:00Z", "running"));
        assertEquals("success", PipelineSyncResolver.resolveGoldStatus("2026-01-01T00:00:00Z", "idle"));
        assertEquals("idle", PipelineSyncResolver.resolveGoldStatus(null, "idle"));
    }

    @Test
    void collectSourceTypeFromStepKey_mapsCollectSteps() {
        assertEquals("NVD", PipelineSyncResolver.collectSourceTypeFromStepKey(PipelineStepKeys.NVD_COLLECT));
        assertEquals("OSV", PipelineSyncResolver.collectSourceTypeFromStepKey(PipelineStepKeys.OSV_COLLECT));
        assertNull(PipelineSyncResolver.collectSourceTypeFromStepKey(PipelineStepKeys.GOLD_REFRESH));
    }
}

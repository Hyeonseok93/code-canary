package com.code_canary.backend.service;

import com.code_canary.backend.constants.PipelineStepKeys;
import com.code_canary.backend.dto.AnalyticsDto;
import com.code_canary.backend.dto.PipelineDto;
import com.code_canary.backend.repository.analytics.IngestionSyncRepository;
import com.code_canary.backend.repository.pipeline.PipelineJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IngestionSyncService {

    private final IngestionSyncRepository ingestionSyncRepository;
    private final PipelineJobRepository pipelineJobRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto.IngestionSyncResponse getIngestionSync() {
        List<Map<String, Object>> rows = ingestionSyncRepository.findAll();
        Map<String, Map<String, Object>> latestJobs = PipelineSyncResolver.indexLatestJobs(
                pipelineJobRepository.findLatestJobsByStepKeys(PipelineStepKeys.INGESTION_STEPS)
        );

        Map<String, Object> nvdRow = PipelineSyncResolver.rowForSource(rows, "NVD");
        Map<String, Object> osvRow = PipelineSyncResolver.rowForSource(rows, "OSV");

        List<PipelineDto.StepStatus> nvdSteps = PipelineSyncResolver.buildSourceSteps(
                PipelineStepKeys.NVD_STEPS, latestJobs, nvdRow
        );
        List<PipelineDto.StepStatus> osvSteps = PipelineSyncResolver.buildSourceSteps(
                PipelineStepKeys.OSV_STEPS, latestJobs, osvRow
        );

        return new AnalyticsDto.IngestionSyncResponse(
                PipelineSyncResolver.resolveSyncStartedAt(nvdRow, latestJobs, PipelineStepKeys.NVD_COLLECT),
                PipelineSyncResolver.resolveSyncStartedAt(osvRow, latestJobs, PipelineStepKeys.OSV_COLLECT),
                PipelineSyncResolver.timestampForColumn(nvdRow, "last_silver_refined_at"),
                PipelineSyncResolver.timestampForColumn(osvRow, "last_silver_refined_at"),
                PipelineSyncResolver.latestGoldRefreshedAt(rows),
                PipelineSyncResolver.resolveSourceStatus(nvdRow, nvdSteps),
                PipelineSyncResolver.resolveSourceStatus(osvRow, osvSteps)
        );
    }
}

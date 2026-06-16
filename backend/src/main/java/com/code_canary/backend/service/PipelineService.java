package com.code_canary.backend.service;

import com.code_canary.backend.config.PipelineJobProperties;
import com.code_canary.backend.constants.PipelineStepKeys;
import com.code_canary.backend.dto.PipelineDto;
import com.code_canary.backend.exception.InvalidRequestException;
import com.code_canary.backend.exception.PipelineJobConflictException;
import com.code_canary.backend.repository.analytics.IngestionSyncRepository;
import com.code_canary.backend.repository.pipeline.PipelineJobRepository;
import com.code_canary.backend.repository.pipeline.PipelineStagingRepository;
import com.code_canary.backend.repository.pipeline.PipelineStatusRepository;
import com.code_canary.backend.validation.PipelineCollectModeValidator;
import com.code_canary.backend.validation.PipelineStagingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PipelineService {

    private static final String STALE_RECLAIM_MESSAGE =
            "Worker heartbeat lost; job marked failed (stale recovery).";
    private static final String MANUAL_RELEASE_MESSAGE =
            "Released by operator (manual stuck job recovery).";
    private static final String STOP_JOB_MESSAGE = "Stopped by operator.";

    private static final List<String> TRACKED_STEPS = List.copyOf(PipelineStepKeys.ALL);

    private final PipelineJobRepository pipelineJobRepository;
    private final PipelineStatusRepository pipelineStatusRepository;
    private final IngestionSyncRepository ingestionSyncRepository;
    private final PipelineStagingRepository pipelineStagingRepository;
    private final PipelineJobProperties pipelineJobProperties;

    @Transactional(readOnly = true)
    public PipelineDto.StatusResponse getStatus() {
        List<Map<String, Object>> syncRows = ingestionSyncRepository.findAll();
        Map<String, Long> bronzeCounts = pipelineStatusRepository.countBronzeBySource();
        Map<String, Long> pendingSilver = pipelineStatusRepository.countPendingSilverBySource();
        Map<String, Long> silverCounts = pipelineStatusRepository.countSilverBySource();
        Map<String, Map<String, Object>> latestJobs = PipelineSyncResolver.indexLatestJobs(
                pipelineJobRepository.findLatestJobsByStepKeys(TRACKED_STEPS)
        );

        List<PipelineDto.SourcePipeline> sources = List.of(
                buildSourcePipeline("NVD", syncRows, bronzeCounts, pendingSilver, silverCounts, latestJobs, PipelineStepKeys.NVD_STEPS),
                buildSourcePipeline("OSV", syncRows, bronzeCounts, pendingSilver, silverCounts, latestJobs, PipelineStepKeys.OSV_STEPS)
        );

        return new PipelineDto.StatusResponse(sources, buildGoldSummary(syncRows, latestJobs));
    }

    @Transactional(readOnly = true)
    public PipelineDto.ActivityLogResponse getRecentActivity(int limit) {
        int safeLimit = Math.clamp(limit, 1, 200);
        List<PipelineDto.ActivityLogEntry> entries = pipelineJobRepository.findRecentActivityLogs(safeLimit)
                .stream()
                .map(row -> new PipelineDto.ActivityLogEntry(
                        ((Number) row.get("id")).longValue(),
                        PipelineJobRepository.timestampToIso(row.get("logged_at")),
                        String.valueOf(row.get("level")),
                        PipelineSyncResolver.sourceFromStepKey(String.valueOf(row.get("step_key"))),
                        String.valueOf(row.get("step_key")),
                        String.valueOf(row.get("message"))
                ))
                .toList();
        return new PipelineDto.ActivityLogResponse(entries);
    }

    @Transactional(readOnly = true)
    public PipelineDto.StagingResponse getStaging() {
        List<PipelineDto.StagingBaseline> nvd = pipelineStagingRepository.listNvdBaselines()
                .stream()
                .map(this::mapStagingBaseline)
                .toList();
        List<PipelineDto.StagingBaseline> osv = pipelineStagingRepository.listOsvBaselines()
                .stream()
                .map(this::mapStagingBaseline)
                .toList();
        return new PipelineDto.StagingResponse(nvd, osv);
    }

    @Transactional
    public PipelineDto.EnqueueJobResponse enqueueJob(
            String stepKey,
            String requestedBy,
            String stagingRef,
            String collectMode
    ) {
        String normalized = stepKey == null ? "" : stepKey.trim().toLowerCase();
        if (!PipelineStepKeys.ALL.contains(normalized)) {
            throw new InvalidRequestException("Unsupported pipeline step: " + stepKey);
        }
        String normalizedStagingRef = PipelineStagingValidator.normalizeOptional(stagingRef);
        PipelineStagingValidator.validateForStep(normalized, normalizedStagingRef);
        String normalizedCollectMode = PipelineCollectModeValidator.normalizeOptional(collectMode);
        if (collectMode != null && !collectMode.isBlank()) {
            PipelineCollectModeValidator.validateForStep(normalized, normalizedCollectMode);
        } else if (PipelineStepKeys.NVD_COLLECT.equals(normalized)) {
            normalizedCollectMode = PipelineCollectModeValidator.normalizeOptional(null);
        } else {
            normalizedCollectMode = null;
        }
        if (normalizedStagingRef != null) {
            ensureStagingBaselineExists(normalized, normalizedStagingRef);
        }
        reclaimStaleRunningJobs();
        if (pipelineJobRepository.hasActiveJob(pipelineJobProperties.getStaleMinutes())) {
            throw new PipelineJobConflictException("Another pipeline job is already queued or running.");
        }

        long jobId = pipelineJobRepository.insertJob(
                normalized,
                requestedBy,
                normalizedStagingRef,
                normalizedCollectMode
        );
        return new PipelineDto.EnqueueJobResponse(jobId, normalized, "queued");
    }

    @Transactional
    public PipelineDto.StopJobResponse stopJob(String stepKey, String requestedBy) {
        String normalized = stepKey == null ? "" : stepKey.trim().toLowerCase();
        if (!PipelineStepKeys.ALL.contains(normalized)) {
            throw new InvalidRequestException("Unsupported pipeline step: " + stepKey);
        }

        if (!PipelineStepKeys.CANCELLABLE_STEPS.contains(normalized)) {
            throw new InvalidRequestException("Stop is only supported for collect steps.");
        }

        Map<String, Object> activeJob = pipelineJobRepository.findActiveJobByStepKey(normalized);
        if (activeJob == null) {
            throw new InvalidRequestException("No active job for step: " + normalized);
        }

        long jobId = ((Number) activeJob.get("id")).longValue();
        String status = String.valueOf(activeJob.get("status"));

        if ("queued".equals(status)) {
            if (!pipelineJobRepository.failQueuedJob(jobId, STOP_JOB_MESSAGE)) {
                throw new InvalidRequestException("No active job for step: " + normalized);
            }
            return new PipelineDto.StopJobResponse(jobId, normalized, "cancelled_queued");
        }

        if (!pipelineJobRepository.requestCancelRunningJob(jobId)) {
            throw new InvalidRequestException("No active job for step: " + normalized);
        }
        pipelineJobRepository.appendJobLog(jobId, "warn", STOP_JOB_MESSAGE + " Stop requested by " + requestedBy + ".");
        return new PipelineDto.StopJobResponse(jobId, normalized, "stop_requested");
    }

    @Transactional
    public PipelineDto.ReleaseStuckJobsResponse releaseStuckJobs(String requestedBy) {
        List<Map<String, Object>> released = pipelineJobRepository.failAllRunningJobs(MANUAL_RELEASE_MESSAGE);
        for (Map<String, Object> row : released) {
            resetIngestionSyncForStep(String.valueOf(row.get("step_key")));
        }
        List<Long> jobIds = released.stream()
                .map(row -> ((Number) row.get("id")).longValue())
                .toList();
        return new PipelineDto.ReleaseStuckJobsResponse(jobIds.size(), jobIds);
    }

    private void reclaimStaleRunningJobs() {
        List<Map<String, Object>> reclaimed = pipelineJobRepository.reclaimStaleRunningJobs(
                pipelineJobProperties.getStaleMinutes(),
                STALE_RECLAIM_MESSAGE
        );
        for (Map<String, Object> row : reclaimed) {
            resetIngestionSyncForStep(String.valueOf(row.get("step_key")));
        }
    }

    private void resetIngestionSyncForStep(String stepKey) {
        String sourceType = PipelineSyncResolver.collectSourceTypeFromStepKey(stepKey);
        if (sourceType != null) {
            ingestionSyncRepository.markFailedIfRunning(sourceType);
        }
    }

    private void ensureStagingBaselineExists(String stepKey, String stagingRef) {
        boolean exists = switch (stepKey) {
            case PipelineStepKeys.NVD_LOAD -> pipelineStagingRepository.nvdBaselineExists(stagingRef);
            case PipelineStepKeys.OSV_LOAD -> pipelineStagingRepository.osvBaselineExists(stagingRef);
            default -> false;
        };
        if (!exists) {
            throw new InvalidRequestException("Baseline not found on staging volume: " + stagingRef);
        }
    }

    private PipelineDto.StagingBaseline mapStagingBaseline(PipelineStagingRepository.StagingEntry entry) {
        return new PipelineDto.StagingBaseline(
                entry.id(),
                entry.label(),
                PipelineJobRepository.timestampToIso(entry.modifiedAt()),
                entry.sizeBytes()
        );
    }

    private PipelineDto.SourcePipeline buildSourcePipeline(
            String source,
            List<Map<String, Object>> syncRows,
            Map<String, Long> bronzeCounts,
            Map<String, Long> pendingSilver,
            Map<String, Long> silverCounts,
            Map<String, Map<String, Object>> latestJobs,
            List<String> stepKeys
    ) {
        Map<String, Object> syncRow = PipelineSyncResolver.rowForSource(syncRows, source);

        List<PipelineDto.StepStatus> steps = PipelineSyncResolver.buildSourceSteps(stepKeys, latestJobs, syncRow);

        String collectStepKey = stepKeys.getFirst();
        return new PipelineDto.SourcePipeline(
                source,
                PipelineSyncResolver.resolveSyncStartedAt(syncRow, latestJobs, collectStepKey),
                PipelineSyncResolver.resolveSourceStatus(syncRow, steps),
                bronzeCounts.getOrDefault(source, 0L),
                pendingSilver.getOrDefault(source, 0L),
                silverCounts.getOrDefault(source, 0L),
                steps
        );
    }

    private PipelineDto.GoldSummary buildGoldSummary(
            List<Map<String, Object>> syncRows,
            Map<String, Map<String, Object>> latestJobs
    ) {
        Optional<Map<String, Object>> goldJob = Optional.ofNullable(latestJobs.get(PipelineStepKeys.GOLD_REFRESH));
        String lastGold = PipelineSyncResolver.latestGoldRefreshedAt(syncRows);

        String jobStatus = goldJob
                .map(job -> PipelineSyncResolver.mapJobStatus(String.valueOf(job.get("status"))))
                .orElse("idle");
        String status = PipelineSyncResolver.resolveGoldStatus(lastGold, jobStatus);

        String lastRunAt = goldJob
                .map(job -> PipelineJobRepository.timestampToIso(
                        job.get("finished_at") != null ? job.get("finished_at") : job.get("started_at")
                ))
                .orElse(null);
        Long durationSeconds = goldJob.map(PipelineJobRepository::durationSeconds).orElse(null);
        Long lastJobId = goldJob.map(job -> ((Number) job.get("id")).longValue()).orElse(null);
        String errorMessage = "failed".equals(jobStatus)
                ? goldJob.map(PipelineJobRepository::errorMessageOrNull).orElse(null)
                : null;

        return new PipelineDto.GoldSummary(
                lastGold,
                pipelineStatusRepository.countExplorerRows(),
                status,
                lastRunAt,
                durationSeconds,
                lastJobId,
                errorMessage
        );
    }
}

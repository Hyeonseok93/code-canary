package com.code_canary.backend.service;

import com.code_canary.backend.repository.analytics.IngestionSyncRepository;
import com.code_canary.backend.repository.pipeline.PipelineStagingRepository;
import com.code_canary.backend.util.StagingBaselineTimestamps;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * After a fresh DB (e.g. {@code docker compose down -v}) restores {@code gold.ingestion_sync}
 * with empty collect timestamps while host staging baselines remain on disk.
 * Parsed baseline times are UTC wall clock and align with {@code CURRENT_TIMESTAMP} in PostgreSQL (UTC).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StagingIngestionSyncBootstrap implements ApplicationRunner {

    private static final String SOURCE_NVD = "NVD";
    private static final String SOURCE_OSV = "OSV";

    private final IngestionSyncRepository ingestionSyncRepository;
    private final PipelineStagingRepository pipelineStagingRepository;

    @Override
    public void run(ApplicationArguments args) {
        bootstrapSource(
                SOURCE_NVD,
                pipelineStagingRepository.findLatestNvdBaseline().map(PipelineStagingRepository.StagingEntry::id)
        );
        bootstrapSource(
                SOURCE_OSV,
                pipelineStagingRepository.findLatestOsvBaseline().map(PipelineStagingRepository.StagingEntry::id)
        );
    }

    private void bootstrapSource(String sourceType, Optional<String> latestBaselineId) {
        if (latestBaselineId.isEmpty()) {
            return;
        }

        String baselineId = latestBaselineId.get();
        Optional<LocalDateTime> collectedAt = StagingBaselineTimestamps.parseCollectedAt(baselineId);
        if (collectedAt.isEmpty()) {
            log.warn(
                    "Skipping ingestion sync bootstrap for {} — unparseable baseline id {}",
                    sourceType,
                    baselineId
            );
            return;
        }

        if (ingestionSyncRepository.bootstrapLastCollectedAtIfMissing(sourceType, collectedAt.get())) {
            log.info(
                    "Bootstrapped {} last_collected_at from latest staging baseline {} ({})",
                    sourceType,
                    baselineId,
                    collectedAt.get()
            );
        }
    }
}

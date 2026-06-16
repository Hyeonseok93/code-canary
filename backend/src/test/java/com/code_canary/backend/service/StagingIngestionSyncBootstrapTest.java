package com.code_canary.backend.service;

import com.code_canary.backend.repository.analytics.IngestionSyncRepository;
import com.code_canary.backend.repository.pipeline.PipelineStagingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StagingIngestionSyncBootstrapTest {

    @Mock
    private IngestionSyncRepository ingestionSyncRepository;

    @Mock
    private PipelineStagingRepository pipelineStagingRepository;

    @InjectMocks
    private StagingIngestionSyncBootstrap bootstrap;

    @Test
    void run_bootstrapsBothSourcesFromLatestBaselines() throws Exception {
        when(pipelineStagingRepository.findLatestNvdBaseline())
                .thenReturn(Optional.of(new PipelineStagingRepository.StagingEntry(
                        "NVD_BASELINE_20250609_143022",
                        Instant.parse("2026-06-09T14:30:22Z"),
                        1024L
                )));
        when(pipelineStagingRepository.findLatestOsvBaseline())
                .thenReturn(Optional.of(new PipelineStagingRepository.StagingEntry(
                        "OSV_BASELINE_20250609_150000.zip",
                        Instant.parse("2026-06-09T15:00:00Z"),
                        2048L
                )));
        when(ingestionSyncRepository.bootstrapLastCollectedAtIfMissing(
                eq("NVD"),
                eq(LocalDateTime.of(2025, 6, 9, 14, 30, 22))
        )).thenReturn(true);
        when(ingestionSyncRepository.bootstrapLastCollectedAtIfMissing(
                eq("OSV"),
                eq(LocalDateTime.of(2025, 6, 9, 15, 0, 0))
        )).thenReturn(true);

        bootstrap.run(new DefaultApplicationArguments(new String[0]));

        verify(ingestionSyncRepository).bootstrapLastCollectedAtIfMissing(
                "NVD",
                LocalDateTime.of(2025, 6, 9, 14, 30, 22)
        );
        verify(ingestionSyncRepository).bootstrapLastCollectedAtIfMissing(
                "OSV",
                LocalDateTime.of(2025, 6, 9, 15, 0, 0)
        );
    }

    @Test
    void run_skipsWhenNoBaselinesOnDisk() throws Exception {
        when(pipelineStagingRepository.findLatestNvdBaseline()).thenReturn(Optional.empty());
        when(pipelineStagingRepository.findLatestOsvBaseline()).thenReturn(Optional.empty());

        bootstrap.run(new DefaultApplicationArguments(new String[0]));

        verify(ingestionSyncRepository, never()).bootstrapLastCollectedAtIfMissing(
                eq("NVD"),
                org.mockito.ArgumentMatchers.any()
        );
        verify(ingestionSyncRepository, never()).bootstrapLastCollectedAtIfMissing(
                eq("OSV"),
                org.mockito.ArgumentMatchers.any()
        );
    }
}

package com.code_canary.backend.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StagingBaselineTimestampsTest {

    @Test
    void parseCollectedAt_readsNvdBaselineFolderName() {
        Optional<LocalDateTime> parsed = StagingBaselineTimestamps.parseCollectedAt("NVD_BASELINE_20250609_143022");

        assertTrue(parsed.isPresent());
        assertEquals(LocalDateTime.of(2025, 6, 9, 14, 30, 22), parsed.get());
    }

    @Test
    void parseCollectedAt_readsOsvBaselineZipName() {
        Optional<LocalDateTime> parsed = StagingBaselineTimestamps.parseCollectedAt("OSV_BASELINE_20250609_150000.zip");

        assertTrue(parsed.isPresent());
        assertEquals(LocalDateTime.of(2025, 6, 9, 15, 0, 0), parsed.get());
    }

    @Test
    void parseCollectedAt_rejectsInvalidNames() {
        assertTrue(StagingBaselineTimestamps.parseCollectedAt("NVD_BASELINE_bad").isEmpty());
        assertTrue(StagingBaselineTimestamps.parseCollectedAt("random-folder").isEmpty());
        assertTrue(StagingBaselineTimestamps.parseCollectedAt(null).isEmpty());
    }
}

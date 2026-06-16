package com.code_canary.backend.util;

import com.code_canary.backend.constants.PipelineStagingConstants;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

public final class StagingBaselineTimestamps {

    private static final DateTimeFormatter BASELINE_TIME = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final int BASELINE_PREFIX_LENGTH = PipelineStagingConstants.NVD_BASELINE_PREFIX.length();

    private StagingBaselineTimestamps() {
    }

    /**
     * Parses {@code NVD_BASELINE_YYYYMMDD_HHMMSS} or {@code OSV_BASELINE_YYYYMMDD_HHMMSS.zip}.
     * Baseline suffixes use UTC wall clock (same as worker collect naming in Docker/UTC).
     */
    public static Optional<LocalDateTime> parseCollectedAt(String baselineId) {
        if (baselineId == null || baselineId.isBlank()) {
            return Optional.empty();
        }

        String name = baselineId.trim();
        if (PipelineStagingConstants.OSV_BASELINE_PATTERN.matcher(name).matches()) {
            name = name.substring(0, name.length() - 4);
        } else if (!PipelineStagingConstants.NVD_BASELINE_PATTERN.matcher(name).matches()) {
            return Optional.empty();
        }

        String timestampPart = name.substring(BASELINE_PREFIX_LENGTH);
        try {
            return Optional.of(LocalDateTime.parse(timestampPart, BASELINE_TIME));
        } catch (DateTimeParseException ex) {
            return Optional.empty();
        }
    }
}

package com.code_canary.backend.validation;

import com.code_canary.backend.constants.PipelineStepKeys;
import com.code_canary.backend.constants.PipelineStagingConstants;
import com.code_canary.backend.exception.InvalidRequestException;

import java.util.Set;

public final class PipelineStagingValidator {

    private static final Set<String> STAGING_STEPS = Set.of(
            PipelineStepKeys.NVD_LOAD,
            PipelineStepKeys.OSV_LOAD
    );

    private PipelineStagingValidator() {
    }

    public static String normalizeOptional(String stagingRef) {
        if (stagingRef == null || stagingRef.isBlank()) {
            return null;
        }
        return stagingRef.trim();
    }

    public static void validateForStep(String stepKey, String stagingRef) {
        if (stagingRef == null) {
            return;
        }
        if (!STAGING_STEPS.contains(stepKey)) {
            throw new InvalidRequestException("stagingRef is not supported for step: " + stepKey);
        }
        boolean valid = switch (stepKey) {
            case PipelineStepKeys.NVD_LOAD -> PipelineStagingConstants.NVD_BASELINE_PATTERN.matcher(stagingRef).matches();
            case PipelineStepKeys.OSV_LOAD -> PipelineStagingConstants.OSV_BASELINE_PATTERN.matcher(stagingRef).matches();
            default -> false;
        };
        if (!valid) {
            throw new InvalidRequestException("Invalid stagingRef for step: " + stepKey);
        }
    }
}

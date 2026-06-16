package com.code_canary.backend.validation;

import com.code_canary.backend.constants.PipelineCollectMode;
import com.code_canary.backend.constants.PipelineStepKeys;
import com.code_canary.backend.exception.InvalidRequestException;

public final class PipelineCollectModeValidator {

    private PipelineCollectModeValidator() {
    }

    public static String normalizeOptional(String collectMode) {
        if (collectMode == null || collectMode.isBlank()) {
            return PipelineCollectMode.FULL;
        }
        return collectMode.trim().toLowerCase();
    }

    public static void validateForStep(String stepKey, String collectMode) {
        if (!PipelineCollectMode.ALL.contains(collectMode)) {
            throw new InvalidRequestException("Unsupported collect mode: " + collectMode);
        }
        if (!PipelineStepKeys.NVD_COLLECT.equals(stepKey)) {
            throw new InvalidRequestException("collectMode is not supported for step: " + stepKey);
        }
    }
}

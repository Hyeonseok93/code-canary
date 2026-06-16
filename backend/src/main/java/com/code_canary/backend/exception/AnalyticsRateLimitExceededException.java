package com.code_canary.backend.exception;

public class AnalyticsRateLimitExceededException extends RuntimeException {

    public AnalyticsRateLimitExceededException(String message) {
        super(message);
    }
}

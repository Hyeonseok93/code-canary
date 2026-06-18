package com.code_canary.backend.exception;

public class AdminRateLimitExceededException extends RuntimeException {

    public AdminRateLimitExceededException(String message) {
        super(message);
    }
}

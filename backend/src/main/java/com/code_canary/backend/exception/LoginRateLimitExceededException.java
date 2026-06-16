package com.code_canary.backend.exception;

public class LoginRateLimitExceededException extends RuntimeException {

    public LoginRateLimitExceededException(String message) {
        super(message);
    }
}

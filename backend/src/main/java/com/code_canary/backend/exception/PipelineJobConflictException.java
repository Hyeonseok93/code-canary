package com.code_canary.backend.exception;

public class PipelineJobConflictException extends RuntimeException {

    public PipelineJobConflictException(String message) {
        super(message);
    }
}

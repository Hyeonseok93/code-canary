package com.code_canary.backend.exception;

public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String internalMessage) {
        super(internalMessage);
    }
}

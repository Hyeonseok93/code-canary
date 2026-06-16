package com.code_canary.backend.exception;

import com.code_canary.backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LoginRateLimitExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleLoginRateLimit(LoginRateLimitExceededException e) {
        log.warn("[AUTH RATE LIMIT] {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(error(HttpStatus.UNAUTHORIZED, "Login failed."));
    }

    private static final String BAD_REQUEST_MESSAGE = "Invalid request.";
    private static final String STAGING_UNAVAILABLE_MESSAGE = "Staging volume is unavailable.";

    private static boolean isPublicAnalyticsRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri != null && uri.startsWith("/api/analytics/");
    }

    @ExceptionHandler(PipelineStagingException.class)
    public ResponseEntity<ApiErrorResponse> handlePipelineStaging(PipelineStagingException e) {
        log.error("[PIPELINE STAGING] {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(error(HttpStatus.SERVICE_UNAVAILABLE, STAGING_UNAVAILABLE_MESSAGE));
    }

    @ExceptionHandler(PipelineJobConflictException.class)
    public ResponseEntity<ApiErrorResponse> handlePipelineJobConflict(PipelineJobConflictException e) {
        log.warn("[PIPELINE CONFLICT] {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(error(HttpStatus.CONFLICT, e.getMessage()));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(
            InvalidRequestException e,
            HttpServletRequest request
    ) {
        log.warn("[BAD REQUEST] {}", e.getMessage());
        String message = isPublicAnalyticsRequest(request) ? BAD_REQUEST_MESSAGE : e.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(HttpStatus.BAD_REQUEST, message));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.warn("[BAD REQUEST] Parameter type mismatch: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(HttpStatus.BAD_REQUEST, BAD_REQUEST_MESSAGE));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException e) {
        log.warn("[AUTH FAILED] {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(error(HttpStatus.UNAUTHORIZED, "Login failed."));
    }

    private static final String NOT_FOUND_MESSAGE = "The requested resource was not found.";

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException e) {
        log.info("[NOT FOUND] {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error(HttpStatus.NOT_FOUND, NOT_FOUND_MESSAGE));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(HttpMessageNotReadableException e) {
        log.warn("[BAD REQUEST] Malformed request body: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(HttpStatus.BAD_REQUEST, "Invalid request payload format."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining(" "));
        log.warn("[VALIDATION FAILED] {}", detail);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(HttpStatus.BAD_REQUEST, BAD_REQUEST_MESSAGE));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAllExceptions(Exception e) {
        log.error("Internal System Exception Caught: ", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error(HttpStatus.INTERNAL_SERVER_ERROR,
                        "An unexpected error occurred. Please contact the administrator."));
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    private static ApiErrorResponse error(HttpStatus status, String message) {
        return ApiErrorResponse.of(status.value(), status.getReasonPhrase(), message);
    }
}

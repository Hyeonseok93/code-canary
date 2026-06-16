package com.code_canary.backend.util;

import com.code_canary.backend.dto.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public final class ApiErrorResponseWriter {

    private ApiErrorResponseWriter() {
    }

    public static void writeJson(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            int status,
            String error,
            String message
    ) throws IOException {
        ApiErrorResponse body = ApiErrorResponse.of(status, error, message);
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    public static void writeJson(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            HttpStatus status,
            String message
    ) throws IOException {
        writeJson(response, objectMapper, status.value(), status.getReasonPhrase(), message);
    }

    public static void writeForApiOrSendError(
            HttpServletRequest request,
            HttpServletResponse response,
            ObjectMapper objectMapper,
            int status,
            String error,
            String message
    ) throws IOException {
        if (!request.getRequestURI().startsWith("/api/")) {
            response.sendError(status);
            return;
        }
        writeJson(response, objectMapper, status, error, message);
    }
}

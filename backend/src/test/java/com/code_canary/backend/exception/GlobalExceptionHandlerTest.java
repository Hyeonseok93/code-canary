package com.code_canary.backend.exception;

import com.code_canary.backend.dto.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void hidesInvalidRequestDetailsOnPublicAnalyticsRoutes() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/analytics/explorer");

        var response = handler.handleInvalidRequest(
                new InvalidRequestException("Invalid severity value: FOO"),
                request
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid request.", requireBody(response).message());
    }

    @Test
    void keepsInvalidRequestDetailsOnAdminRoutes() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/admin/pipeline/jobs");

        var response = handler.handleInvalidRequest(
                new InvalidRequestException("Unsupported pipeline step: FOO"),
                request
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Unsupported pipeline step: FOO", requireBody(response).message());
    }

    @Test
    void hidesPipelineStagingPathsFromClients() {
        var response = handler.handlePipelineStaging(
                new PipelineStagingException("Failed to read staging directory: /data/nvd", new RuntimeException())
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertEquals("Staging volume is unavailable.", requireBody(response).message());
    }

    private static ApiErrorResponse requireBody(
            org.springframework.http.ResponseEntity<ApiErrorResponse> response
    ) {
        ApiErrorResponse body = response.getBody();
        assertNotNull(body);
        return body;
    }
}

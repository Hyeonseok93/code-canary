package com.code_canary.backend.security;

import com.code_canary.backend.exception.AdminRateLimitExceededException;
import com.code_canary.backend.util.ApiErrorResponseWriter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 15)
@RequiredArgsConstructor
public class AdminApiFilter extends OncePerRequestFilter {

    private static final String ADMIN_PREFIX = "/api/admin/";

    private final AdminRateLimiter adminRateLimiter;
    private final ClientIpResolver clientIpResolver;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !request.getRequestURI().startsWith(ADMIN_PREFIX);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = clientIpResolver.resolve(request);
        try {
            adminRateLimiter.assertAllowed(clientIp);
        } catch (AdminRateLimitExceededException ex) {
            ApiErrorResponseWriter.writeJson(
                    response,
                    objectMapper,
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests. Try again later."
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}

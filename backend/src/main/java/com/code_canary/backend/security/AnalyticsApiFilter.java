package com.code_canary.backend.security;

import com.code_canary.backend.config.AnalyticsSecurityProperties;
import com.code_canary.backend.exception.AnalyticsRateLimitExceededException;
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
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class AnalyticsApiFilter extends OncePerRequestFilter {

    private static final String ANALYTICS_PREFIX = "/api/analytics/";
    private static final Set<String> CACHEABLE_SUFFIXES = Set.of(
            "/metrics",
            "/sync",
            "/dashboard",
            "/vector",
            "/ecosystem",
            "/weakness",
            "/remediation",
            "/kev-insights"
    );

    private final AnalyticsRateLimiter analyticsRateLimiter;
    private final ClientIpResolver clientIpResolver;
    private final AnalyticsSecurityProperties analyticsSecurityProperties;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith(ANALYTICS_PREFIX);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = clientIpResolver.resolve(request);
        AnalyticsRateLimiter.RequestCategory category = resolveCategory(request.getRequestURI());

        try {
            analyticsRateLimiter.assertAllowed(clientIp, category);
        } catch (AnalyticsRateLimitExceededException ex) {
            writeRateLimitResponse(response);
            return;
        }

        if (isCacheableDashboardRequest(request)) {
            response.setHeader(
                    "Cache-Control",
                    "public, max-age=" + analyticsSecurityProperties.getCacheMaxAgeSeconds()
            );
        }

        filterChain.doFilter(request, response);
    }

    private AnalyticsRateLimiter.RequestCategory resolveCategory(String path) {
        if (path.startsWith(ANALYTICS_PREFIX + "explorer/")) {
            return AnalyticsRateLimiter.RequestCategory.DETAIL;
        }
        if (path.equals(ANALYTICS_PREFIX + "explorer") || path.startsWith(ANALYTICS_PREFIX + "explorer?")) {
            return AnalyticsRateLimiter.RequestCategory.EXPLORER;
        }
        return AnalyticsRateLimiter.RequestCategory.GENERAL;
    }

    private boolean isCacheableDashboardRequest(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        return CACHEABLE_SUFFIXES.stream().anyMatch(suffix -> path.equals("/api/analytics" + suffix));
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        ApiErrorResponseWriter.writeJson(
                response,
                objectMapper,
                HttpStatus.TOO_MANY_REQUESTS,
                "Too many requests. Try again later."
        );
    }
}

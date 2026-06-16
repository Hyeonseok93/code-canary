package com.code_canary.backend.security;

import com.code_canary.backend.config.AnalyticsSecurityProperties;
import com.code_canary.backend.exception.AnalyticsRateLimitExceededException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyticsRateLimiter {

    public enum RequestCategory {
        GENERAL,
        EXPLORER,
        DETAIL
    }

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final SlidingWindowRateLimiter slidingWindowRateLimiter;
    private final AnalyticsSecurityProperties properties;

    public void assertAllowed(String clientIp, RequestCategory category) {
        int limit = switch (category) {
            case GENERAL -> properties.getMaxGeneralRequestsPerMinute();
            case EXPLORER -> properties.getMaxExplorerRequestsPerMinute();
            case DETAIL -> properties.getMaxDetailRequestsPerMinute();
        };

        String key = RateLimitKeys.analytics(category.name(), clientIp);
        try {
            if (!slidingWindowRateLimiter.tryAcquire(key, WINDOW, limit)) {
                throw new AnalyticsRateLimitExceededException("Too many analytics requests. Try again later.");
            }
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable for analytics limiter", ex);
            throw new AnalyticsRateLimitExceededException("Analytics rate limiting is temporarily unavailable.");
        }
    }
}

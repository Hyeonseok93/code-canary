package com.code_canary.backend.security;

import com.code_canary.backend.config.AdminSecurityProperties;
import com.code_canary.backend.exception.AdminRateLimitExceededException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminRateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final SlidingWindowRateLimiter slidingWindowRateLimiter;
    private final AdminSecurityProperties properties;

    public void assertAllowed(String clientIp) {
        String key = RateLimitKeys.adminRequests(clientIp);
        try {
            if (!slidingWindowRateLimiter.tryAcquire(key, WINDOW, properties.getMaxRequestsPerMinute())) {
                throw new AdminRateLimitExceededException("Too many admin requests. Try again later.");
            }
        } catch (AdminRateLimitExceededException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable for admin limiter", ex);
            throw new AdminRateLimitExceededException("Admin rate limiting is temporarily unavailable.");
        }
    }
}

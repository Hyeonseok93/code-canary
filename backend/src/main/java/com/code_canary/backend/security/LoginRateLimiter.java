package com.code_canary.backend.security;

import com.code_canary.backend.config.LoginSecurityProperties;
import com.code_canary.backend.exception.LoginRateLimitExceededException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoginRateLimiter {

    private static final Duration REQUEST_WINDOW = Duration.ofMinutes(1);

    private final SlidingWindowRateLimiter slidingWindowRateLimiter;
    private final LoginSecurityProperties properties;

    public void assertAllowed(String clientIp) {
        String failureKey = RateLimitKeys.loginFailures(clientIp);
        String requestKey = RateLimitKeys.loginRequests(clientIp);
        Duration lockoutWindow = Duration.ofMinutes(properties.getLockoutMinutes());

        try {
            long failures = slidingWindowRateLimiter.count(failureKey, lockoutWindow);
            if (failures >= properties.getMaxFailures()) {
                throw new LoginRateLimitExceededException(
                        "Too many failed login attempts. Try again later."
                );
            }

            if (!slidingWindowRateLimiter.tryAcquire(requestKey, REQUEST_WINDOW, properties.getMaxRequestsPerMinute())) {
                throw new LoginRateLimitExceededException(
                        "Too many login requests. Try again later."
                );
            }
        } catch (LoginRateLimitExceededException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable for login limiter", ex);
            throw new LoginRateLimitExceededException("Login is temporarily unavailable.");
        }
    }

    public void recordFailure(String clientIp) {
        try {
            slidingWindowRateLimiter.record(
                    RateLimitKeys.loginFailures(clientIp),
                    Duration.ofMinutes(properties.getLockoutMinutes())
            );
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable while recording login failure", ex);
        }
    }

    public void recordSuccess(String clientIp) {
        try {
            slidingWindowRateLimiter.reset(
                    RateLimitKeys.loginFailures(clientIp),
                    RateLimitKeys.loginRequests(clientIp)
            );
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable while clearing login counters", ex);
        }
    }
}

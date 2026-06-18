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

    public void assertAllowed(String clientIp, String username) {
        String failureKey = RateLimitKeys.loginFailures(clientIp);
        String userFailureKey = RateLimitKeys.loginFailuresForUser(username);
        String requestKey = RateLimitKeys.loginRequests(clientIp);
        Duration lockoutWindow = Duration.ofMinutes(properties.getLockoutMinutes());

        try {
            long ipFailures = slidingWindowRateLimiter.count(failureKey, lockoutWindow);
            long userFailures = slidingWindowRateLimiter.count(userFailureKey, lockoutWindow);
            if (ipFailures >= properties.getMaxFailures() || userFailures >= properties.getMaxFailures()) {
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

    public void recordFailure(String clientIp, String username) {
        Duration lockoutWindow = Duration.ofMinutes(properties.getLockoutMinutes());
        try {
            slidingWindowRateLimiter.record(RateLimitKeys.loginFailures(clientIp), lockoutWindow);
            slidingWindowRateLimiter.record(RateLimitKeys.loginFailuresForUser(username), lockoutWindow);
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable while recording login failure", ex);
        }
    }

    public void recordSuccess(String clientIp, String username) {
        try {
            slidingWindowRateLimiter.reset(
                    RateLimitKeys.loginFailures(clientIp),
                    RateLimitKeys.loginFailuresForUser(username),
                    RateLimitKeys.loginRequests(clientIp)
            );
        } catch (DataAccessException ex) {
            log.error("[RATE LIMIT] Redis unavailable while clearing login counters", ex);
        }
    }
}

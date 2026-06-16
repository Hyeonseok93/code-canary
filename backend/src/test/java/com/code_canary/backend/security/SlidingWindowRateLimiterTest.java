package com.code_canary.backend.security;

import com.redis.testcontainers.RedisContainer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class SlidingWindowRateLimiterTest {

    private static final String KEY = "test:window";

    @Container
    static RedisContainer redis = new RedisContainer("redis:7-alpine");

    private LettuceConnectionFactory connectionFactory;
    private SlidingWindowRateLimiter rateLimiter;

    @BeforeEach
    @SuppressWarnings("null")
    void setUp() {
        connectionFactory = new LettuceConnectionFactory(
                Objects.requireNonNull(redis.getHost()),
                redis.getFirstMappedPort()
        );
        connectionFactory.afterPropertiesSet();

        StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
        template.afterPropertiesSet();
        rateLimiter = new SlidingWindowRateLimiter(template);
        rateLimiter.reset(KEY);
    }

    @AfterEach
    void tearDown() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
    }

    @Test
    void tryAcquire_enforcesLimitWithinWindow() {
        Duration window = Duration.ofMinutes(1);

        assertTrue(rateLimiter.tryAcquire(KEY, window, 2));
        assertTrue(rateLimiter.tryAcquire(KEY, window, 2));
        assertFalse(rateLimiter.tryAcquire(KEY, window, 2));
        assertEquals(2, rateLimiter.count(KEY, window));
    }

    @Test
    void record_incrementsCountWithoutLimitCheck() {
        Duration window = Duration.ofMinutes(15);

        rateLimiter.record(KEY, window);
        rateLimiter.record(KEY, window);

        assertEquals(2, rateLimiter.count(KEY, window));
    }

    @Test
    void reset_clearsCounters() {
        Duration window = Duration.ofMinutes(1);
        rateLimiter.tryAcquire(KEY, window, 5);

        rateLimiter.reset(KEY);

        assertEquals(0, rateLimiter.count(KEY, window));
    }
}

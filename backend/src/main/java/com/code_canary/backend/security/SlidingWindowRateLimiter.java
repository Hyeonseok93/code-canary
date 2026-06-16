package com.code_canary.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SlidingWindowRateLimiter {

    private static final RedisScript<Long> COUNT_SCRIPT = script(
            """
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', tonumber(ARGV[1]) - tonumber(ARGV[2]))
            return redis.call('ZCARD', KEYS[1])
            """
    );

    private static final RedisScript<Long> TRY_ACQUIRE_SCRIPT = script(
            """
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', tonumber(ARGV[1]) - tonumber(ARGV[2]))
            local current = redis.call('ZCARD', KEYS[1])
            if current >= tonumber(ARGV[3]) then
              return 0
            end
            redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
            redis.call('PEXPIRE', KEYS[1], ARGV[2])
            return 1
            """
    );

    private static final RedisScript<Long> RECORD_SCRIPT = script(
            """
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', tonumber(ARGV[1]) - tonumber(ARGV[2]))
            redis.call('ZADD', KEYS[1], ARGV[1], ARGV[3])
            redis.call('PEXPIRE', KEYS[1], ARGV[2])
            return 1
            """
    );

    private final StringRedisTemplate redisTemplate;

    public long count(String key, Duration window) {
        Long result = execute(COUNT_SCRIPT, key,
                String.valueOf(System.currentTimeMillis()),
                String.valueOf(window.toMillis())
        );
        return result != null ? result : 0L;
    }

    public boolean tryAcquire(String key, Duration window, int limit) {
        Long result = execute(TRY_ACQUIRE_SCRIPT, key,
                String.valueOf(System.currentTimeMillis()),
                String.valueOf(window.toMillis()),
                String.valueOf(limit),
                uniqueMember()
        );
        return result != null && result == 1L;
    }

    public void record(String key, Duration window) {
        execute(RECORD_SCRIPT, key,
                String.valueOf(System.currentTimeMillis()),
                String.valueOf(window.toMillis()),
                uniqueMember()
        );
    }

    public void reset(String... keys) {
        for (String key : keys) {
            if (key != null) {
                redisTemplate.delete(key);
            }
        }
    }

    @SuppressWarnings("null")
    private Long execute(RedisScript<Long> script, String key, String... args) {
        return redisTemplate.execute(script, keyList(key), (Object[]) args);
    }

    private static List<String> keyList(String key) {
        return Collections.singletonList(Objects.requireNonNull(key));
    }

    @SuppressWarnings("null")
    private static RedisScript<Long> script(String lua) {
        return new DefaultRedisScript<>(lua, Long.class);
    }

    private static String uniqueMember() {
        return System.nanoTime() + ":" + UUID.randomUUID();
    }
}

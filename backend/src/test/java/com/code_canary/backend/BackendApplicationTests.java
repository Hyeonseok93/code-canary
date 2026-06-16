package com.code_canary.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import com.redis.testcontainers.RedisContainer;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class BackendApplicationTests {

	private static final String TEST_REDIS_PASSWORD = "test-redis-password";

	@Container
	@ServiceConnection
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

	@Container
	@ServiceConnection(name = "redis")
	@SuppressWarnings("resource")
	static RedisContainer redis = new RedisContainer("redis:7-alpine")
			.withCommand("redis-server", "--requirepass", TEST_REDIS_PASSWORD);

	@Test
	void contextLoads() {
	}

}

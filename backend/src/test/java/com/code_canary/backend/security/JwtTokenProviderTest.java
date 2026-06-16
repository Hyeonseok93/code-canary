package com.code_canary.backend.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    @Test
    void resolveSecretBytes_acceptsUtf8SecretAtLeast32Bytes() {
        byte[] bytes = JwtTokenProvider.resolveSecretBytes("local-dev-jwt-secret-min-32-chars!!");
        assertTrue(bytes.length >= 32);
    }

    @Test
    void resolveSecretBytes_rejectsShortSecret() {
        assertThrows(IllegalStateException.class, () -> JwtTokenProvider.resolveSecretBytes("CHANGE_ME"));
    }
}

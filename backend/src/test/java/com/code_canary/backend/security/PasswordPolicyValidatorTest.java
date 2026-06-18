package com.code_canary.backend.security;

import com.code_canary.backend.config.PasswordPolicyProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PasswordPolicyValidatorTest {

    private PasswordPolicyValidator validator;

    @BeforeEach
    void setUp() {
        PasswordPolicyProperties properties = new PasswordPolicyProperties();
        validator = new PasswordPolicyValidator(properties);
    }

    @Test
    void acceptsCompliantPassword() {
        assertDoesNotThrow(() -> validator.validate("SecurePass1!"));
    }

    @Test
    void rejectsShortPassword() {
        assertThrows(IllegalArgumentException.class, () -> validator.validate("Short1!"));
    }

    @Test
    void rejectsMissingSpecialCharacter() {
        assertThrows(IllegalArgumentException.class, () -> validator.validate("SecurePassword1"));
    }
}

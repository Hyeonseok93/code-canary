package com.code_canary.backend.security;

import com.code_canary.backend.config.PasswordPolicyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PasswordPolicyValidator {

    private final PasswordPolicyProperties properties;

    public void validate(String password) {
        if (password == null || password.length() < properties.getMinLength()) {
            throw new IllegalArgumentException(
                    "Password must be at least " + properties.getMinLength() + " characters."
            );
        }
        if (properties.isRequireUppercase() && password.chars().noneMatch(Character::isUpperCase)) {
            throw new IllegalArgumentException("Password must contain an uppercase letter.");
        }
        if (properties.isRequireLowercase() && password.chars().noneMatch(Character::isLowerCase)) {
            throw new IllegalArgumentException("Password must contain a lowercase letter.");
        }
        if (properties.isRequireDigit() && password.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException("Password must contain a digit.");
        }
        if (properties.isRequireSpecial() && password.chars().noneMatch(ch -> !Character.isLetterOrDigit(ch))) {
            throw new IllegalArgumentException("Password must contain a special character.");
        }
    }
}

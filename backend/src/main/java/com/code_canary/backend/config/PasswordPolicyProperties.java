package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.security.password")
@Getter
@Setter
public class PasswordPolicyProperties {

    private int minLength = 12;
    private boolean requireUppercase = true;
    private boolean requireLowercase = true;
    private boolean requireDigit = true;
    private boolean requireSpecial = true;
}

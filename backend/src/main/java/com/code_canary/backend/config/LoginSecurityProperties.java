package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.security.login")
@Getter
@Setter
public class LoginSecurityProperties {

    private int maxFailures = 5;
    private int lockoutMinutes = 15;
    private int maxRequestsPerMinute = 10;
}

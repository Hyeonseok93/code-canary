package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.security.admin")
@Getter
@Setter
public class AdminSecurityProperties {

    private int maxRequestsPerMinute = 30;
}

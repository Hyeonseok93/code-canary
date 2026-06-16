package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.security.analytics")
@Getter
@Setter
public class AnalyticsSecurityProperties {

    private int maxGeneralRequestsPerMinute = 60;
    private int maxExplorerRequestsPerMinute = 30;
    private int maxDetailRequestsPerMinute = 30;
    private int cacheMaxAgeSeconds = 120;
}

package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "app.security.trusted-proxy")
@Getter
@Setter
public class TrustedProxyProperties {

    /** Empty by default — X-Real-IP is trusted only when explicitly configured (see local/docker-compose.yml). */
    private List<String> cidrs = new ArrayList<>();
}

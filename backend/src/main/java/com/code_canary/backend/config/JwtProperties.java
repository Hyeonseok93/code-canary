package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private long expiration;
    private Cookie cookie = new Cookie();

    @Getter
    @Setter
    public static class Cookie {
        private String name = "ADMIN_TOKEN";
        private String path = "/api";
        private boolean secure = true;
        private String sameSite = "Strict";
    }
}


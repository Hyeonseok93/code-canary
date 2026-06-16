package com.code_canary.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.explorer")
@Getter
@Setter
public class ExplorerProperties {

    private int maxPageSize = 100;
    private int maxSearchLength = 200;
    private int maxFilterTokens = 20;
    private int maxFilterTokenLength = 100;
}

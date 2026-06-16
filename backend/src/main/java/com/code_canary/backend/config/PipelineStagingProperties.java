package com.code_canary.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pipeline.staging")
public record PipelineStagingProperties(
        String dataRoot
) {
    public String resolvedDataRoot() {
        if (dataRoot == null || dataRoot.isBlank()) {
            return "/data";
        }
        return dataRoot.trim();
    }
}

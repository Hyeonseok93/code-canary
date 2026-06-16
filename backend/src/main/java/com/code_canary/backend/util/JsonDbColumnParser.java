package com.code_canary.backend.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JsonDbColumnParser {

    private final ObjectMapper objectMapper;

    public Object parse(Object dbValue, Object defaultValue) {
        if (dbValue == null) {
            return defaultValue;
        }
        try {
            String jsonStr = dbValue.toString();
            if (jsonStr.trim().isEmpty() || "null".equalsIgnoreCase(jsonStr.trim())) {
                return defaultValue;
            }
            return objectMapper.readValue(jsonStr, Object.class);
        } catch (Exception e) {
            return defaultValue;
        }
    }
}

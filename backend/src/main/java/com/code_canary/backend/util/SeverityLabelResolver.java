package com.code_canary.backend.util;

import java.util.Locale;

public final class SeverityLabelResolver {

    private SeverityLabelResolver() {
    }

    public static String resolve(double baseScore) {
        if (baseScore >= 9.0) {
            return "CRITICAL";
        }
        if (baseScore >= 7.0) {
            return "HIGH";
        }
        if (baseScore >= 4.0) {
            return "MEDIUM";
        }
        if (baseScore > 0.0) {
            return "LOW";
        }
        return "NONE";
    }

    public static String sqlPredicateForLabel(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        return switch (label.trim().toUpperCase(Locale.ROOT)) {
            case "CRITICAL" -> "base_score >= 9.0";
            case "HIGH" -> "(base_score >= 7.0 AND base_score < 9.0)";
            case "MEDIUM" -> "(base_score >= 4.0 AND base_score < 7.0)";
            case "LOW" -> "(base_score > 0 AND base_score < 4.0)";
            case "NONE" -> "(base_score = 0 OR base_score IS NULL)";
            default -> null;
        };
    }
}

package com.code_canary.backend.validation;

import com.code_canary.backend.config.ExplorerProperties;
import com.code_canary.backend.exception.InvalidRequestException;
import com.code_canary.backend.util.SqlLikeEscaper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ExplorerQueryValidator {

    private static final Map<String, String> SOURCE_VALUES = Map.of(
            "NVD", "NVD",
            "OSV", "OSV",
            "MAL", "MAL"
    );

    private static final Map<String, String> VECTOR_VALUES = Map.of(
            "NETWORK", "NETWORK",
            "ADJACENT", "ADJACENT",
            "LOCAL", "LOCAL",
            "PHYSICAL", "PHYSICAL",
            "NOT SPECIFIED", "Not Specified"
    );

    private static final Map<String, String> SEVERITY_VALUES = Map.of(
            "CRITICAL", "CRITICAL",
            "HIGH", "HIGH",
            "MEDIUM", "MEDIUM",
            "LOW", "LOW",
            "NONE", "NONE"
    );

    private static final Map<String, String> STATUS_VALUES = canonicalMap(
            "Active", "Modified", "Analyzed", "Deferred", "Withdrawn",
            "Rejected", "Awaiting Analysis", "Received", "Undergoing Analysis"
    );

    private static final Map<String, String> REMEDIATION_VALUES = canonicalMap(
            "Patch Ready", "Unpatched", "Invalid", "Solution Provided", "Pending", "End of Life"
    );

    private static final Map<String, String> PILLAR_VALUES = canonicalMap(
            "Injection & Input Validation",
            "Memory Safety",
            "Auth & Access Control",
            "Crypto & Data Security",
            "Resource Management",
            "Logic & Design Errors",
            "Others & Unclassified",
            "Not Specified"
    );

    private static final Map<String, String> ECOSYSTEM_VALUES = Map.of(
            "NPM", "npm",
            "PYPI", "PyPI",
            "MAVEN", "Maven",
            "GO", "Go",
            "NUGET", "NuGet",
            "RUBYGEMS", "RubyGems",
            "DEBIAN", "Debian",
            "NOT SPECIFIED", "Not Specified"
    );

    private final ExplorerProperties properties;

    public int validatePage(int page) {
        if (page < 1) {
            throw new InvalidRequestException("Page must be >= 1, got: " + page);
        }
        return page;
    }

    public int validateSize(int size) {
        if (size < 1 || size > properties.getMaxPageSize()) {
            throw new InvalidRequestException(
                    "Size must be between 1 and " + properties.getMaxPageSize() + ", got: " + size
            );
        }
        return size;
    }

    public String validateSearch(String search) {
        if (!StringUtils.hasText(search)) {
            return null;
        }
        String trimmed = search.trim();
        if (trimmed.length() > properties.getMaxSearchLength()) {
            throw new InvalidRequestException("Search exceeds max length of " + properties.getMaxSearchLength());
        }
        return trimmed;
    }

    public String validateSource(String source) {
        return validateCsv(source, SOURCE_VALUES, "source");
    }

    public String validateVector(String vector) {
        return validateCsv(vector, VECTOR_VALUES, "vector");
    }

    public String validateStatus(String status) {
        return validateCsv(status, STATUS_VALUES, "status");
    }

    public String validateRemediation(String remediation) {
        return validateCsv(remediation, REMEDIATION_VALUES, "remediation");
    }

    public String validatePillar(String pillar) {
        return validateCsv(pillar, PILLAR_VALUES, "pillar");
    }

    public String validateEcosystem(String ecosystem) {
        return validateCsv(ecosystem, ECOSYSTEM_VALUES, "ecosystem");
    }

    public String validateSeverity(String severity) {
        return validateCsv(severity, SEVERITY_VALUES, "severity");
    }

    public String escapeLikeToken(String token) {
        return SqlLikeEscaper.escapeToken(token);
    }

    private String validateCsv(String raw, Map<String, String> allowed, String paramName) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String[] tokens = raw.split(",");
        if (tokens.length > properties.getMaxFilterTokens()) {
            throw new InvalidRequestException(
                    paramName + " exceeds max selections (" + properties.getMaxFilterTokens() + ")"
            );
        }

        LinkedHashMap<String, String> selected = new LinkedHashMap<>();
        for (String token : tokens) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.length() > properties.getMaxFilterTokenLength()) {
                throw new InvalidRequestException(paramName + " token exceeds max length");
            }
            String key = normalizeKey(trimmed);
            String canonical = allowed.get(key);
            if (canonical == null) {
                throw new InvalidRequestException("Invalid " + paramName + " value: " + trimmed);
            }
            selected.putIfAbsent(key, canonical);
        }

        if (selected.isEmpty()) {
            return null;
        }
        return String.join(",", selected.values());
    }

    private static String normalizeKey(String value) {
        return value.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private static Map<String, String> canonicalMap(String... values) {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        for (String value : values) {
            map.put(normalizeKey(value), value);
        }
        return Map.copyOf(map);
    }
}

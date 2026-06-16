package com.code_canary.backend.service.explorer;

import com.code_canary.backend.util.SeverityLabelResolver;
import com.code_canary.backend.util.SqlLikeEscaper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class ExplorerQueryBuilder {

    private static final Pattern DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final String BASE_WHERE = " WHERE 1=1";
    private static final String NOT_SPECIFIED = "Not Specified";

    public ExplorerFilterQuery build(
            String search,
            String source,
            String vector,
            String status,
            String remediation,
            String pillar,
            String ecosystem,
            String severity,
            String startDate,
            String endDate,
            Boolean isKev) {

        StringBuilder whereClause = new StringBuilder(BASE_WHERE);
        List<Object> params = new ArrayList<>();

        if (search != null) {
            whereClause.append(" AND search_vector @@ plainto_tsquery('english', ?)");
            params.add(search);
        }
        appendSimpleInClause(whereClause, params, "source", source);
        appendInWithNotSpecified(
                whereClause,
                params,
                "attack_vector",
                vector,
                "(attack_vector IS NULL OR attack_vector = '' OR attack_vector = 'UNKNOWN')"
        );
        appendSimpleInClause(whereClause, params, "status", status);
        appendSimpleInClause(whereClause, params, "remediation_status", remediation);
        appendInWithNotSpecified(
                whereClause,
                params,
                "weakness_pillar",
                pillar,
                "(weakness_pillar IS NULL OR weakness_pillar = '')"
        );
        appendEcosystemClause(whereClause, params, ecosystem);
        appendSeverityClause(whereClause, severity);

        if (startDate != null && !startDate.trim().isEmpty() && DATE_PATTERN.matcher(startDate.trim()).matches()) {
            whereClause.append(" AND published_date >= ?::DATE");
            params.add(startDate.trim());
        }
        if (endDate != null && !endDate.trim().isEmpty() && DATE_PATTERN.matcher(endDate.trim()).matches()) {
            whereClause.append(" AND published_date <= ?::DATE");
            params.add(endDate.trim());
        }

        if (isKev != null && isKev) {
            whereClause.append(" AND is_kev = TRUE");
        }

        boolean hasFilters = !whereClause.toString().equals(BASE_WHERE)
                || (isKev != null && isKev)
                || (severity != null && !severity.isEmpty());

        return new ExplorerFilterQuery(whereClause.toString(), List.copyOf(params), hasFilters);
    }

    private static void appendSimpleInClause(
            StringBuilder whereClause,
            List<Object> params,
            String column,
            String csv
    ) {
        if (csv == null || csv.trim().isEmpty()) {
            return;
        }
        String[] tokens = csv.split(",");
        whereClause.append(" AND ").append(column).append(" IN (");
        appendPlaceholders(whereClause, tokens.length);
        whereClause.append(")");
        for (String token : tokens) {
            params.add(token.trim());
        }
    }

    private static void appendInWithNotSpecified(
            StringBuilder whereClause,
            List<Object> params,
            String column,
            String csv,
            String notSpecifiedPredicate
    ) {
        if (csv == null || csv.trim().isEmpty()) {
            return;
        }

        String[] tokens = csv.split(",");
        boolean hasNotSpecified = false;
        List<String> validValues = new ArrayList<>();
        for (String token : tokens) {
            String trimmed = token.trim();
            if (NOT_SPECIFIED.equalsIgnoreCase(trimmed)) {
                hasNotSpecified = true;
            } else if (!trimmed.isEmpty()) {
                validValues.add(trimmed);
            }
        }

        whereClause.append(" AND (");
        boolean needOr = false;
        if (!validValues.isEmpty()) {
            whereClause.append(column).append(" IN (");
            appendPlaceholders(whereClause, validValues.size());
            whereClause.append(")");
            params.addAll(validValues);
            needOr = true;
        }
        if (hasNotSpecified) {
            if (needOr) {
                whereClause.append(" OR ");
            }
            whereClause.append(notSpecifiedPredicate);
        }
        whereClause.append(")");
    }

    private static void appendEcosystemClause(StringBuilder whereClause, List<Object> params, String ecosystem) {
        if (ecosystem == null || ecosystem.trim().isEmpty()) {
            return;
        }

        String[] tokens = ecosystem.split(",");
        whereClause.append(" AND (");
        for (int i = 0; i < tokens.length; i++) {
            String token = tokens[i].trim();
            if (NOT_SPECIFIED.equalsIgnoreCase(token)) {
                whereClause.append("(ecosystems IS NULL OR ecosystems = '' OR ecosystems = 'N/A')");
            } else {
                whereClause.append("ecosystems LIKE ? ESCAPE '\\'");
                params.add("%" + SqlLikeEscaper.escapeToken(token) + "%");
            }
            if (i < tokens.length - 1) {
                whereClause.append(" OR ");
            }
        }
        whereClause.append(")");
    }

    private static void appendSeverityClause(StringBuilder whereClause, String severity) {
        if (severity == null || severity.trim().isEmpty()) {
            return;
        }

        String[] tokens = severity.split(",");
        whereClause.append(" AND (");
        boolean first = true;
        for (String rawToken : tokens) {
            String clause = SeverityLabelResolver.sqlPredicateForLabel(rawToken.trim());
            if (clause == null) {
                continue;
            }
            if (!first) {
                whereClause.append(" OR ");
            }
            whereClause.append(clause);
            first = false;
        }
        if (first) {
            whereClause.setLength(whereClause.length() - " AND (".length());
        } else {
            whereClause.append(")");
        }
    }

    private static void appendPlaceholders(StringBuilder whereClause, int count) {
        for (int i = 0; i < count; i++) {
            whereClause.append("?");
            if (i < count - 1) {
                whereClause.append(", ");
            }
        }
    }

    public record ExplorerFilterQuery(String whereClause, List<Object> params, boolean hasFilters) {
    }
}

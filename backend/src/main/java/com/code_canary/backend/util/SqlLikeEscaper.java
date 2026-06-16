package com.code_canary.backend.util;

public final class SqlLikeEscaper {

    private SqlLikeEscaper() {
    }

    public static String escapeToken(String token) {
        return token
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}

package com.code_canary.backend.util;

public final class Percentages {

    private Percentages() {
    }

    public static double roundPercent(long count, long total) {
        return total > 0 ? Math.round((count * 100.0 / total) * 100.0) / 100.0 : 0.0;
    }
}

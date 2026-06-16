package com.code_canary.backend.dto;

public record ExplorerQueryParams(
        int page,
        int size,
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
        Boolean isKev
) {
    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_SIZE = 50;

    public ExplorerQueryParams {
        if (page == 0) {
            page = DEFAULT_PAGE;
        }
        if (size == 0) {
            size = DEFAULT_SIZE;
        }
    }
}

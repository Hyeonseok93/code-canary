package com.code_canary.backend.constants;

import java.util.Set;

public final class PipelineCollectMode {

    public static final String FULL = "full";
    public static final String INCREMENTAL = "incremental";

    public static final Set<String> ALL = Set.of(FULL, INCREMENTAL);

    private PipelineCollectMode() {
    }
}

package com.code_canary.backend.constants;

import java.util.regex.Pattern;

public final class PipelineStagingConstants {

    public static final String NVD_BASELINE_PREFIX = "NVD_BASELINE_";
    public static final String OSV_BASELINE_PREFIX = "OSV_BASELINE_";
    public static final Pattern NVD_BASELINE_PATTERN = Pattern.compile("^NVD_BASELINE_\\d{8}_\\d{6}$");
    public static final Pattern OSV_BASELINE_PATTERN = Pattern.compile("^OSV_BASELINE_\\d{8}_\\d{6}\\.zip$");

    private PipelineStagingConstants() {
    }
}

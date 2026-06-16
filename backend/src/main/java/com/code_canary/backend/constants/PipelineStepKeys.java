package com.code_canary.backend.constants;

import java.util.List;
import java.util.Set;

public final class PipelineStepKeys {

    public static final String NVD_COLLECT = "nvd-collect";
    public static final String NVD_LOAD = "nvd-load";
    public static final String NVD_SILVER = "nvd-silver";
    public static final String OSV_COLLECT = "osv-collect";
    public static final String OSV_LOAD = "osv-load";
    public static final String OSV_SILVER = "osv-silver";
    public static final String GOLD_REFRESH = "gold-refresh";

    public static final List<String> NVD_STEPS = List.of(NVD_COLLECT, NVD_LOAD, NVD_SILVER);
    public static final List<String> OSV_STEPS = List.of(OSV_COLLECT, OSV_LOAD, OSV_SILVER);
    public static final List<String> CANCELLABLE_STEPS = List.of(NVD_COLLECT, OSV_COLLECT);
    public static final List<String> INGESTION_STEPS = List.of(
            NVD_COLLECT,
            NVD_LOAD,
            NVD_SILVER,
            OSV_COLLECT,
            OSV_LOAD,
            OSV_SILVER
    );

    public static final Set<String> ALL = Set.of(
            NVD_COLLECT,
            NVD_LOAD,
            NVD_SILVER,
            OSV_COLLECT,
            OSV_LOAD,
            OSV_SILVER,
            GOLD_REFRESH
    );

    private PipelineStepKeys() {
    }
}

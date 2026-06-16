package com.code_canary.backend.dto;

import java.util.List;

public class AnalyticsDto {

    public record SeverityDistribution(
        String label,
        long count,
        double percentage
    ) {}

    public record AnnualTrend(
        int year,
        long critical,
        long high,
        long medium,
        long low,
        long total
    ) {}

    public record DashboardAnalyticsResponse(
        List<SeverityDistribution> distribution,
        List<AnnualTrend> trend,
        List<SourceDistribution> sourceDistribution,
        List<SourceTrend> sourceTrend,
        double averageScore
    ) {}

    // --- Vector Analysis DTOs ---
    public record VectorDistribution(
        String attackVector,
        long count,
        double percentage
    ) {}

    public record VectorTrend(
        int year,
        long network,
        long adjacent,
        long local,
        long physical,
        long total
    ) {}

    public record VectorAnalyticsResponse(
        List<VectorDistribution> distribution,
        List<VectorTrend> trends
    ) {}

    // --- Source Analysis DTOs ---
    public record SourceDistribution(
        String label,
        long count,
        double percentage
    ) {}

    public record SourceTrend(
        int year,
        long nvd,
        long osv,
        long mal,
        long total
    ) {}

    // --- Ecosystem Analysis DTOs ---
    public record EcosystemDistribution(
        String ecosystem,
        long count,
        double percentage
    ) {}

    public record EcosystemTrend(
        int year,
        String ecosystem,
        long count
    ) {}

    public record EcosystemAnalyticsResponse(
        List<EcosystemDistribution> distribution,
        List<EcosystemTrend> trends
    ) {}

    // --- Weakness Analysis DTOs ---
    public record WeaknessPillar(
        String pillar,
        long count,
        double percentage
    ) {}

    public record WeaknessDetail(
        String cweId,
        String name,
        String pillar,
        long count,
        double percentage
    ) {}

    public record WeaknessAnalyticsResponse(
        List<WeaknessPillar> pillars,
        List<WeaknessDetail> details
    ) {}

    // --- Remediation Analysis DTOs ---
    public record RemediationDistribution(
        String label,
        long count,
        double percentage
    ) {}

    public record RemediationTrend(
        int year,
        String label,
        long count
    ) {}

    public record RemediationAnalyticsResponse(
        List<RemediationDistribution> distribution,
        List<RemediationTrend> trends
    ) {}

    // --- KEV Intelligence DTO ---
    public record KevInsight(
        String cveId,
        String name,
        Double baseScore,
        String addedDate,
        String dueDate,
        Integer dDay,
        String weaknessType,
        String remediationStatus
    ) {}

    // --- Explorer Analysis DTOs ---
    public record ExplorerItem(
        String vulnId,
        String source,
        Double baseScore,
        String publishedDate,
        String summary,
        String status,
        String attackVector,
        String remediationStatus,
        String weaknessPillar,
        String ecosystems,
        Boolean isKev,
        String kevDueDate
    ) {}

    public record ExplorerPageResponse(
        List<ExplorerItem> items,
        long totalItems,
        int totalPages,
        int currentPage
    ) {}

    // --- Summary Metrics DTO ---
    public record SummaryMetricsResponse(
        java.util.Map<String, Long> metrics,
        String lastUpdatedAt
    ) {}

    public record IngestionSyncResponse(
        String nvdLastCollectedAt,
        String osvLastCollectedAt,
        String nvdLastSilverRefinedAt,
        String osvLastSilverRefinedAt,
        String lastGoldRefreshedAt,
        String nvdStatus,
        String osvStatus
    ) {}
}

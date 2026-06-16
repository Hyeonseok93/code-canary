package com.code_canary.backend.service;

import com.code_canary.backend.dto.AnalyticsDto;
import com.code_canary.backend.repository.analytics.GoldAnalyticsRepository;
import com.code_canary.backend.util.Percentages;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardAnalyticsService {

    @FunctionalInterface
    private interface DistributionFactory<T> {
        T create(String label, long count, double percentage);
    }

    private final GoldAnalyticsRepository goldAnalyticsRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto.DashboardAnalyticsResponse getDashboardAnalytics() {
        return new AnalyticsDto.DashboardAnalyticsResponse(
                getSeverityDistribution(),
                getAnnualTrend(),
                getSourceDistribution(),
                getSourceTrend(),
                getAverageSeverityScore()
        );
    }

    @Transactional(readOnly = true)
    public AnalyticsDto.VectorAnalyticsResponse getVectorAnalytics() {
        List<Map<String, Object>> rows = goldAnalyticsRepository.findVectorDistributionRows();
        return new AnalyticsDto.VectorAnalyticsResponse(
                toPercentDistribution(rows, "label", AnalyticsDto.VectorDistribution::new),
                goldAnalyticsRepository.findVectorTrend()
        );
    }

    @Transactional(readOnly = true)
    public AnalyticsDto.EcosystemAnalyticsResponse getEcosystemAnalytics() {
        return new AnalyticsDto.EcosystemAnalyticsResponse(
                goldAnalyticsRepository.findEcosystemDistribution(),
                goldAnalyticsRepository.findEcosystemTrend()
        );
    }

    @Transactional(readOnly = true)
    public AnalyticsDto.WeaknessAnalyticsResponse getWeaknessAnalytics() {
        return new AnalyticsDto.WeaknessAnalyticsResponse(
                goldAnalyticsRepository.findWeaknessPillars(),
                goldAnalyticsRepository.findWeaknessDetails()
        );
    }

    @Transactional(readOnly = true)
    public AnalyticsDto.RemediationAnalyticsResponse getRemediationAnalytics() {
        return new AnalyticsDto.RemediationAnalyticsResponse(
                goldAnalyticsRepository.findRemediationDistribution(),
                goldAnalyticsRepository.findRemediationTrend()
        );
    }

    @Transactional(readOnly = true)
    public List<AnalyticsDto.KevInsight> getLatestKevInsights() {
        return goldAnalyticsRepository.findLatestKevInsights();
    }

    private List<AnalyticsDto.SeverityDistribution> getSeverityDistribution() {
        return toPercentDistribution(
                goldAnalyticsRepository.findSeverityDistributionRows(),
                "severity_label",
                AnalyticsDto.SeverityDistribution::new
        );
    }

    private List<AnalyticsDto.AnnualTrend> getAnnualTrend() {
        return goldAnalyticsRepository.findAnnualTrend();
    }

    private List<AnalyticsDto.SourceDistribution> getSourceDistribution() {
        return goldAnalyticsRepository.findSourceDistribution();
    }

    private List<AnalyticsDto.SourceTrend> getSourceTrend() {
        return goldAnalyticsRepository.findSourceTrend();
    }

    private double getAverageSeverityScore() {
        Double avg = goldAnalyticsRepository.findAverageSeverityScore();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    private static <T> List<T> toPercentDistribution(
            List<Map<String, Object>> rows,
            String labelKey,
            DistributionFactory<T> factory
    ) {
        long total = rows.stream()
                .mapToLong(row -> ((Number) row.get("count")).longValue())
                .sum();

        return rows.stream()
                .map(row -> {
                    long count = ((Number) row.get("count")).longValue();
                    String label = (String) row.get(labelKey);
                    return factory.create(label, count, Percentages.roundPercent(count, total));
                })
                .collect(Collectors.toList());
    }
}

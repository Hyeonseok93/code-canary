package com.code_canary.backend.service;

import com.code_canary.backend.dto.AnalyticsDto;
import com.code_canary.backend.entity.SummaryMetric;
import com.code_canary.backend.repository.SummaryMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SummaryMetricsService {

    private final SummaryMetricRepository metricRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto.SummaryMetricsResponse getSummaryMetrics() {
        List<SummaryMetric> allMetrics = metricRepository.findAll();

        Map<String, Long> metricsMap = allMetrics.stream()
                .collect(Collectors.toMap(
                        SummaryMetric::getMetricKey,
                        SummaryMetric::getMetricValue
                ));

        String lastUpdated = allMetrics.stream()
                .filter(m -> m.getMetricKey().equals("total_intelligence"))
                .findFirst()
                .map(m -> m.getLastUpdatedAt() != null ? m.getLastUpdatedAt().toString() : "")
                .orElse("");

        return new AnalyticsDto.SummaryMetricsResponse(metricsMap, lastUpdated);
    }
}

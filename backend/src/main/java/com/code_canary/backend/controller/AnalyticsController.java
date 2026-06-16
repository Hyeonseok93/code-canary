package com.code_canary.backend.controller;

import com.code_canary.backend.dto.AnalyticsDto;
import com.code_canary.backend.dto.ExplorerQueryParams;
import com.code_canary.backend.dto.VulnerabilityDetailResponse;
import com.code_canary.backend.service.DashboardAnalyticsService;
import com.code_canary.backend.service.ExplorerService;
import com.code_canary.backend.service.IngestionSyncService;
import com.code_canary.backend.service.SummaryMetricsService;
import com.code_canary.backend.service.VulnerabilityDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final SummaryMetricsService summaryMetricsService;
    private final IngestionSyncService ingestionSyncService;
    private final DashboardAnalyticsService dashboardAnalyticsService;
    private final ExplorerService explorerService;
    private final VulnerabilityDetailService vulnerabilityDetailService;

    @GetMapping("/metrics")
    public ResponseEntity<AnalyticsDto.SummaryMetricsResponse> getMetrics() {
        return ResponseEntity.ok(summaryMetricsService.getSummaryMetrics());
    }

    @GetMapping("/sync")
    public ResponseEntity<AnalyticsDto.IngestionSyncResponse> getIngestionSync() {
        return ResponseEntity.ok(ingestionSyncService.getIngestionSync());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDto.DashboardAnalyticsResponse> getDashboardAnalytics() {
        return ResponseEntity.ok(dashboardAnalyticsService.getDashboardAnalytics());
    }

    @GetMapping("/vector")
    public ResponseEntity<AnalyticsDto.VectorAnalyticsResponse> getVectorAnalytics() {
        return ResponseEntity.ok(dashboardAnalyticsService.getVectorAnalytics());
    }

    @GetMapping("/ecosystem")
    public ResponseEntity<AnalyticsDto.EcosystemAnalyticsResponse> getEcosystemAnalytics() {
        return ResponseEntity.ok(dashboardAnalyticsService.getEcosystemAnalytics());
    }

    @GetMapping("/weakness")
    public ResponseEntity<AnalyticsDto.WeaknessAnalyticsResponse> getWeaknessAnalytics() {
        return ResponseEntity.ok(dashboardAnalyticsService.getWeaknessAnalytics());
    }

    @GetMapping("/remediation")
    public ResponseEntity<AnalyticsDto.RemediationAnalyticsResponse> getRemediationAnalytics() {
        return ResponseEntity.ok(dashboardAnalyticsService.getRemediationAnalytics());
    }

    @GetMapping("/kev-insights")
    public ResponseEntity<List<AnalyticsDto.KevInsight>> getKevInsights() {
        return ResponseEntity.ok(dashboardAnalyticsService.getLatestKevInsights());
    }

    @GetMapping("/explorer")
    public ResponseEntity<AnalyticsDto.ExplorerPageResponse> getExplorerData(
            @ModelAttribute ExplorerQueryParams params) {
        return ResponseEntity.ok(explorerService.getExplorerData(params));
    }

    @GetMapping("/explorer/{vulnId}")
    public ResponseEntity<VulnerabilityDetailResponse> getVulnerabilityDetail(@PathVariable String vulnId) {
        return ResponseEntity.ok(vulnerabilityDetailService.getVulnerabilityDetail(vulnId));
    }
}

package com.code_canary.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "intel_summary", schema = "gold")
@Getter
@NoArgsConstructor
public class SummaryMetric {

    @Id
    @Column(name = "metric_key")
    private String metricKey;

    @Column(name = "metric_name", nullable = false)
    private String metricName;

    @Column(name = "metric_value")
    private Long metricValue;

    private String description;

    private LocalDateTime lastUpdatedAt;
}


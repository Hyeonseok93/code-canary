package com.code_canary.backend.repository;

import com.code_canary.backend.entity.SummaryMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SummaryMetricRepository extends JpaRepository<SummaryMetric, String> {
}


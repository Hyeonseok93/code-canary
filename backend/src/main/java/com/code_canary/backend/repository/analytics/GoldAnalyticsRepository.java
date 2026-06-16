package com.code_canary.backend.repository.analytics;

import com.code_canary.backend.dto.AnalyticsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class GoldAnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> findSeverityDistributionRows() {
        return jdbcTemplate.queryForList(
                "SELECT severity_label, count FROM gold.risk_distribution WHERE severity_label != 'None'"
        );
    }

    public List<AnalyticsDto.AnnualTrend> findAnnualTrend() {
        String sql = "SELECT pub_year, critical_count, high_count, medium_count, low_count, total_count "
                + "FROM gold.risk_annual_trend ORDER BY pub_year ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new AnalyticsDto.AnnualTrend(
                rs.getInt("pub_year"),
                rs.getLong("critical_count"),
                rs.getLong("high_count"),
                rs.getLong("medium_count"),
                rs.getLong("low_count"),
                rs.getLong("total_count")
        ));
    }

    public List<AnalyticsDto.SourceDistribution> findSourceDistribution() {
        String sql = "SELECT label, count, percentage FROM gold.source_distribution WHERE label != 'Total Intelligence'";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new AnalyticsDto.SourceDistribution(
                rs.getString("label"),
                rs.getLong("count"),
                rs.getDouble("percentage")
        ));
    }

    public List<AnalyticsDto.SourceTrend> findSourceTrend() {
        String sql = "SELECT pub_year, nvd_count, osv_count, mal_count, total_count "
                + "FROM gold.source_annual_trend ORDER BY pub_year ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new AnalyticsDto.SourceTrend(
                rs.getInt("pub_year"),
                rs.getLong("nvd_count"),
                rs.getLong("osv_count"),
                rs.getLong("mal_count"),
                rs.getLong("total_count")
        ));
    }

    public Double findAverageSeverityScore() {
        return jdbcTemplate.queryForObject("SELECT AVG(score) FROM gold.v_unified_severity", Double.class);
    }

    public List<Map<String, Object>> findVectorDistributionRows() {
        String distSql = """
                SELECT
                    CASE WHEN label = 'ADJACENT_NETWORK' THEN 'ADJACENT' ELSE label END as label,
                    SUM(count) as count
                FROM gold.vector_distribution
                WHERE label != 'UNKNOWN'
                GROUP BY 1
                """;
        return jdbcTemplate.queryForList(distSql);
    }

    public List<AnalyticsDto.VectorTrend> findVectorTrend() {
        String trendSql = """
                SELECT
                    pub_year,
                    network_count,
                    adjacent_count,
                    local_count,
                    physical_count,
                    total_count
                FROM gold.vector_annual_trend
                ORDER BY pub_year ASC
                """;
        return jdbcTemplate.query(trendSql, (rs, rowNum) -> new AnalyticsDto.VectorTrend(
                rs.getInt("pub_year"),
                rs.getLong("network_count"),
                rs.getLong("adjacent_count"),
                rs.getLong("local_count"),
                rs.getLong("physical_count"),
                rs.getLong("total_count")
        ));
    }

    public List<AnalyticsDto.EcosystemDistribution> findEcosystemDistribution() {
        String distSql = "SELECT ecosystem, count, percentage FROM gold.ecosystem_distribution ORDER BY count DESC";
        return jdbcTemplate.query(distSql, (rs, rowNum) -> new AnalyticsDto.EcosystemDistribution(
                rs.getString("ecosystem"),
                rs.getLong("count"),
                rs.getDouble("percentage")
        ));
    }

    public List<AnalyticsDto.EcosystemTrend> findEcosystemTrend() {
        String trendSql = "SELECT pub_year, ecosystem, count FROM gold.ecosystem_annual_trend "
                + "ORDER BY pub_year ASC, count DESC";
        return jdbcTemplate.query(trendSql, (rs, rowNum) -> new AnalyticsDto.EcosystemTrend(
                rs.getInt("pub_year"),
                rs.getString("ecosystem"),
                rs.getLong("count")
        ));
    }

    public List<AnalyticsDto.WeaknessPillar> findWeaknessPillars() {
        String pillarSql = "SELECT pillar, count, percentage FROM gold.weakness_pillar_stats ORDER BY count DESC";
        return jdbcTemplate.query(pillarSql, (rs, rowNum) -> new AnalyticsDto.WeaknessPillar(
                rs.getString("pillar"),
                rs.getLong("count"),
                rs.getDouble("percentage")
        ));
    }

    public List<AnalyticsDto.WeaknessDetail> findWeaknessDetails() {
        String detailSql = "SELECT cwe_id, name, pillar, count, percentage FROM gold.weakness_detail_stats "
                + "ORDER BY count DESC";
        return jdbcTemplate.query(detailSql, (rs, rowNum) -> new AnalyticsDto.WeaknessDetail(
                rs.getString("cwe_id"),
                rs.getString("name"),
                rs.getString("pillar"),
                rs.getLong("count"),
                rs.getDouble("percentage")
        ));
    }

    public List<AnalyticsDto.RemediationDistribution> findRemediationDistribution() {
        String distSql = "SELECT label, count, percentage FROM gold.remediation_distribution ORDER BY count DESC";
        return jdbcTemplate.query(distSql, (rs, rowNum) -> new AnalyticsDto.RemediationDistribution(
                rs.getString("label"),
                rs.getLong("count"),
                rs.getDouble("percentage")
        ));
    }

    public List<AnalyticsDto.RemediationTrend> findRemediationTrend() {
        String trendSql = "SELECT pub_year, label, count FROM gold.remediation_annual_trend ORDER BY pub_year ASC";
        return jdbcTemplate.query(trendSql, (rs, rowNum) -> new AnalyticsDto.RemediationTrend(
                rs.getInt("pub_year"),
                rs.getString("label"),
                rs.getLong("count")
        ));
    }

    public List<AnalyticsDto.KevInsight> findLatestKevInsights() {
        String sql = "SELECT cve_id, name, base_score, added_date, due_date, d_day, weakness_type, remediation_status "
                + "FROM gold.latest_kev_insights ORDER BY added_date DESC LIMIT 12";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new AnalyticsDto.KevInsight(
                rs.getString("cve_id"),
                rs.getString("name"),
                rs.getDouble("base_score"),
                rs.getString("added_date"),
                rs.getString("due_date"),
                rs.getObject("d_day", Integer.class),
                rs.getString("weakness_type"),
                rs.getString("remediation_status")
        ));
    }
}

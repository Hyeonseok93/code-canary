package com.code_canary.backend.repository.analytics;

import com.code_canary.backend.constants.ExplorerInventoryConstants;
import com.code_canary.backend.dto.AnalyticsDto;
import com.code_canary.backend.service.explorer.ExplorerQueryBuilder.ExplorerFilterQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ExplorerInventoryRepository {

    private final JdbcTemplate jdbcTemplate;

    public long countItems(ExplorerFilterQuery filter) {
        if (!filter.hasFilters()) {
            Long totalItems = jdbcTemplate.queryForObject(
                    "SELECT metric_value FROM gold.intel_summary WHERE metric_key = ?",
                    Long.class,
                    ExplorerInventoryConstants.TOTAL_METRIC_KEY
            );
            return totalItems != null ? totalItems : 0L;
        }

        String countSql = "SELECT COUNT(*) FROM " + ExplorerInventoryConstants.VIEW + filter.whereClause();
        if (filter.params().isEmpty()) {
            Long totalItems = jdbcTemplate.queryForObject(countSql, Long.class);
            return totalItems != null ? totalItems : 0L;
        }
        Long totalItems = jdbcTemplate.queryForObject(countSql, Long.class, filter.params().toArray());
        return totalItems != null ? totalItems : 0L;
    }

    public List<AnalyticsDto.ExplorerItem> findItems(ExplorerFilterQuery filter, int size, int offset) {
        String dataSql = "SELECT vuln_id, source, base_score, published_date, summary, status, attack_vector, "
                + "remediation_status, weakness_pillar, ecosystems, is_kev, kev_due_date "
                + "FROM " + ExplorerInventoryConstants.VIEW
                + filter.whereClause()
                + " ORDER BY published_date DESC NULLS LAST, vuln_id DESC "
                + "LIMIT ? OFFSET ?";

        List<Object> queryParams = new ArrayList<>(filter.params());
        queryParams.add(size);
        queryParams.add(offset);

        return jdbcTemplate.query(dataSql, (rs, rowNum) -> new AnalyticsDto.ExplorerItem(
                rs.getString("vuln_id"),
                rs.getString("source"),
                rs.getObject("base_score") != null ? rs.getDouble("base_score") : 0.0,
                rs.getString("published_date"),
                rs.getString("summary"),
                rs.getString("status"),
                rs.getString("attack_vector"),
                rs.getString("remediation_status"),
                rs.getString("weakness_pillar"),
                rs.getString("ecosystems"),
                rs.getBoolean("is_kev"),
                rs.getString("kev_due_date")
        ), queryParams.toArray());
    }
}

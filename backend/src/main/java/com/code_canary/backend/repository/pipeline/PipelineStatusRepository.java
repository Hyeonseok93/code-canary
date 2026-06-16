package com.code_canary.backend.repository.pipeline;

import com.code_canary.backend.constants.ExplorerInventoryConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Repository
@RequiredArgsConstructor
public class PipelineStatusRepository {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Long> countBronzeBySource() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT source_type, COUNT(*) AS cnt
                FROM bronze.raw_vulnerability_data
                GROUP BY source_type
                """
        );
        return toSourceCountMap(rows);
    }

    public Map<String, Long> countPendingSilverBySource() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT source_type, COUNT(*) AS cnt
                FROM bronze.raw_vulnerability_data
                WHERE processed_status = 'PENDING'
                GROUP BY source_type
                """
        );
        return toSourceCountMap(rows);
    }

    public Map<String, Long> countSilverBySource() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("NVD", countTableRows("SELECT COUNT(*) FROM silver.cve_vulnerabilities"));
        counts.put("OSV", countTableRows("SELECT COUNT(*) FROM silver.osv_vulnerabilities"));
        return counts;
    }

    private long countTableRows(String sql) {
        Long count = jdbcTemplate.queryForObject(Objects.requireNonNull(sql), Long.class);
        return count != null ? count : 0L;
    }

    public long countExplorerRows() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + ExplorerInventoryConstants.VIEW,
                Long.class
        );
        return count != null ? count : 0L;
    }

    private static Map<String, Long> toSourceCountMap(List<Map<String, Object>> rows) {
        Map<String, Long> counts = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String source = String.valueOf(row.get("source_type")).toUpperCase();
            Object cnt = row.get("cnt");
            long value = cnt instanceof Number number ? number.longValue() : Long.parseLong(String.valueOf(cnt));
            counts.put(source, value);
        }
        return counts;
    }
}

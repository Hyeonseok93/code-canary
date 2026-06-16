package com.code_canary.backend.service;

import com.code_canary.backend.dto.AnalyticsDto;
import com.code_canary.backend.dto.ExplorerQueryParams;
import com.code_canary.backend.repository.analytics.ExplorerInventoryRepository;
import com.code_canary.backend.service.explorer.ExplorerQueryBuilder;
import com.code_canary.backend.service.explorer.ExplorerQueryBuilder.ExplorerFilterQuery;
import com.code_canary.backend.validation.ExplorerQueryValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExplorerService {

    private final ExplorerQueryValidator explorerQueryValidator;
    private final ExplorerQueryBuilder explorerQueryBuilder;
    private final ExplorerInventoryRepository explorerInventoryRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto.ExplorerPageResponse getExplorerData(ExplorerQueryParams params) {
        int page = explorerQueryValidator.validatePage(params.page());
        int size = explorerQueryValidator.validateSize(params.size());
        String search = explorerQueryValidator.validateSearch(params.search());
        String source = explorerQueryValidator.validateSource(params.source());
        String vector = explorerQueryValidator.validateVector(params.vector());
        String status = explorerQueryValidator.validateStatus(params.status());
        String remediation = explorerQueryValidator.validateRemediation(params.remediation());
        String pillar = explorerQueryValidator.validatePillar(params.pillar());
        String ecosystem = explorerQueryValidator.validateEcosystem(params.ecosystem());
        String severity = explorerQueryValidator.validateSeverity(params.severity());

        ExplorerFilterQuery filter = explorerQueryBuilder.build(
                search,
                source,
                vector,
                status,
                remediation,
                pillar,
                ecosystem,
                severity,
                params.startDate(),
                params.endDate(),
                params.isKev()
        );

        long totalItems = explorerInventoryRepository.countItems(filter);
        int totalPages = (int) Math.ceil((double) totalItems / size);
        int offset = (page - 1) * size;

        List<AnalyticsDto.ExplorerItem> items = explorerInventoryRepository.findItems(filter, size, offset);
        return new AnalyticsDto.ExplorerPageResponse(items, totalItems, totalPages, page);
    }
}

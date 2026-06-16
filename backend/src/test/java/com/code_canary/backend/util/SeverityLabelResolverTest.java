package com.code_canary.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SeverityLabelResolverTest {

    @Test
    void resolve_mapsScoreToLabel() {
        assertEquals("CRITICAL", SeverityLabelResolver.resolve(9.0));
        assertEquals("HIGH", SeverityLabelResolver.resolve(7.0));
        assertEquals("MEDIUM", SeverityLabelResolver.resolve(4.0));
        assertEquals("LOW", SeverityLabelResolver.resolve(0.1));
        assertEquals("NONE", SeverityLabelResolver.resolve(0.0));
    }

    @Test
    void sqlPredicateForLabel_mapsLabelToSql() {
        assertEquals("base_score >= 9.0", SeverityLabelResolver.sqlPredicateForLabel("critical"));
        assertEquals("(base_score >= 7.0 AND base_score < 9.0)", SeverityLabelResolver.sqlPredicateForLabel("HIGH"));
        assertNull(SeverityLabelResolver.sqlPredicateForLabel("unknown"));
    }
}

import logging
import re
from cvss import CVSS2, CVSS3, CVSS4
from cwe2.database import Database
from code_canary_worker.utils.db_manager import get_engine
from sqlalchemy import text
from code_canary_worker.utils.ingestion_sync import mark_gold_refreshed
from code_canary_worker.utils.log_sanitize import exc_type_name
from code_canary_worker.utils.progress_logger import (
    PROGRESS_INTERVAL,
    CWE_PROGRESS_INTERVAL,
    format_progress,
    format_completed,
    format_count,
    gold_step,
    should_log_progress,
)

logger = logging.getLogger("CodeCanary.Refinery.Gold")

OSV_SEVERITY_PENDING_QUERY = text("""
    SELECT COUNT(*) FROM silver.osv_severities
    WHERE score_string IS NOT NULL AND score_string != ''
""")

SNAPSHOT_TABLES = {
    "gold.risk_distribution": "gold.v_risk_distribution",
    "gold.risk_annual_trend": "gold.v_risk_annual_trend",
    "gold.vector_distribution": "gold.v_vector_distribution",
    "gold.vector_annual_trend": "gold.v_vector_annual_trend",
    "gold.source_distribution": "gold.v_source_distribution",
    "gold.source_annual_trend": "gold.v_source_annual_trend",
    "gold.ecosystem_distribution": "gold.v_ecosystem_distribution",
    "gold.ecosystem_annual_trend": "gold.v_ecosystem_annual_trend",
    "gold.weakness_pillar_stats": "gold.v_weakness_pillar_stats",
    "gold.weakness_detail_stats": "gold.v_weakness_detail_stats",
    "gold.remediation_distribution": "gold.v_remediation_distribution",
    "gold.remediation_annual_trend": "gold.v_remediation_annual_trend",
    "gold.latest_kev_insights": "gold.v_latest_kev_insights",
}

# --- [Constants] CWE Root Pillar 정의 (MITRE 기준 최상위 노드들) ---
ROOT_PILLARS = {
    74: 'Injection & Input Validation',
    707: 'Injection & Input Validation',
    20: 'Injection & Input Validation',
    118: 'Memory Safety',
    119: 'Memory Safety',
    264: 'Auth & Access Control',
    255: 'Auth & Access Control',
    275: 'Auth & Access Control',
    284: 'Auth & Access Control',
    285: 'Auth & Access Control',
    287: 'Auth & Access Control',
    310: 'Crypto & Data Security',
    311: 'Crypto & Data Security',
    254: 'Crypto & Data Security',
    399: 'Resource Management',
    664: 'Resource Management',
    189: 'Logic & Design Errors',
    19: 'Logic & Design Errors',
    16: 'Logic & Design Errors',
    703: 'Logic & Design Errors',
    682: 'Logic & Design Errors',
    691: 'Logic & Design Errors',
    693: 'Logic & Design Errors',
}

CATEGORY_MAPPING = {
    697: 'Logic & Design Errors',
    1000: 'Others & Unclassified',
    699: 'Logic & Design Errors',
    17: 'Logic & Design Errors',
    388: 'Logic & Design Errors',
}


class CWEDassifier:
    """CWE 계층 구조 분석 및 Pillar 분류 클래스"""
    def __init__(self, db):
        self.db = db
        self.memo = {}

    def get_parents(self, cwe_obj) -> list:
        parents = []
        rw = getattr(cwe_obj, 'related_weaknesses', None)
        if not rw or not isinstance(rw, str):
            return parents
        matches = re.findall(r'ChildOf:CWE ID:(\d+)', rw)
        return [int(m) for m in matches]

    def classify(self, cwe_id: int, depth=0) -> str:
        if depth > 12:
            return 'Others & Unclassified'
        if cwe_id in self.memo:
            return self.memo[cwe_id]

        if cwe_id in ROOT_PILLARS:
            return ROOT_PILLARS[cwe_id]
        if cwe_id in CATEGORY_MAPPING:
            return CATEGORY_MAPPING[cwe_id]

        try:
            cwe_obj = self.db.get(cwe_id)
        except Exception:
            return 'Others & Unclassified'
        if not cwe_obj:
            return 'Others & Unclassified'

        parents = self.get_parents(cwe_obj)
        if not parents:
            return 'Others & Unclassified'

        for p_id in parents:
            res = self.classify(p_id, depth + 1)
            if res != 'Others & Unclassified':
                self.memo[cwe_id] = res
                return res

        self.memo[cwe_id] = 'Others & Unclassified'
        return 'Others & Unclassified'


def _enrich_osv_scores_batch(batch_size=5000) -> int:
    """OSV 점수 보강 배치 1회 실행. 처리 건수 반환 (0이면 완료)."""
    LABEL_MAP = {'critical': 9.5, 'high': 8.0, 'medium': 5.5, 'low': 2.0, 'negligible': 0.5, 'none': 0.0}

    with get_engine().begin() as conn:
        records = conn.execute(text("""
            SELECT s.osv_id, s.score_string
            FROM silver.osv_severities s
            LEFT JOIN gold.intel_osv_scores m ON s.osv_id = m.osv_id
            WHERE m.osv_id IS NULL AND s.score_string IS NOT NULL AND s.score_string != ''
            LIMIT :batch_size
        """), {"batch_size": batch_size}).fetchall()

        if not records:
            return 0

        enrich_list = []
        for osv_id, score_str in records:
            score = None
            label = 'UNKNOWN'
            if not score_str:
                continue
            score_str_lower = score_str.strip().lower()

            if score_str.startswith('CVSS:') or '/AV:' in score_str or score_str.startswith('AV:'):
                try:
                    norm = f"CVSS:2.0/{score_str}" if score_str.startswith("AV:") else score_str
                    if norm.startswith('CVSS:4.0'):
                        c = CVSS4(norm)
                    elif norm.startswith('CVSS:3'):
                        c = CVSS3(norm)
                    else:
                        c = CVSS2(norm)
                    score = float(c.base_score)
                except Exception:
                    pass

                if score is None:
                    if '/C:H/I:H/A:H' in score_str:
                        score = 9.8
                    elif '/C:H' in score_str or '/I:H' in score_str:
                        score = 7.5
                    else:
                        score = 5.0
            elif score_str_lower in LABEL_MAP:
                score = LABEL_MAP[score_str_lower]
                label = score_str_lower.upper()

            if score is not None:
                if label == 'UNKNOWN':
                    if score >= 9.0:
                        label = 'CRITICAL'
                    elif score >= 7.0:
                        label = 'HIGH'
                    elif score >= 4.0:
                        label = 'MEDIUM'
                    else:
                        label = 'LOW'
                enrich_list.append({"id": osv_id, "score": score, "label": label})

        if not enrich_list:
            return 0

        conn.execute(text("""
            INSERT INTO gold.intel_osv_scores (osv_id, calculated_score, severity_label)
            VALUES (:id, :score, :label)
            ON CONFLICT (osv_id) DO UPDATE SET
                calculated_score = EXCLUDED.calculated_score,
                severity_label = EXCLUDED.severity_label,
                last_updated_at = NOW()
        """), enrich_list)

        return len(enrich_list)


def run_step_1_osv_enrichment(batch_size=PROGRESS_INTERVAL):
    """Step 1/5: OSV Score Enrichment"""
    logger.info(gold_step(1, "OSV Score Enrichment — starting"))

    with get_engine().connect() as conn:
        pending_total = conn.execute(OSV_SEVERITY_PENDING_QUERY).scalar() or 0

    if pending_total == 0:
        logger.info(gold_step(1, "Pending: 0 severity records — nothing to enrich"))
        logger.info(gold_step(1, format_completed(0, 0, "enriched")))
        return

    logger.info(gold_step(1, f"Pending: {format_count(pending_total)} severity records to enrich"))

    total_processed = 0
    while True:
        batch_count = _enrich_osv_scores_batch(batch_size)
        if not batch_count:
            break
        total_processed += batch_count
        if should_log_progress(total_processed, batch_size) or total_processed >= pending_total:
            logger.info(gold_step(1, format_progress(total_processed, pending_total)))

    logger.info(gold_step(1, format_completed(total_processed, pending_total, "enriched")))


def run_step_2_vector_analysis():
    """Step 2/5: Vector Analysis"""
    logger.info(gold_step(2, "Vector Analysis — starting"))

    with get_engine().begin() as conn:
        logger.info(gold_step(2, "Truncating gold.intel_vector_analysis"))

        conn.execute(text("TRUNCATE TABLE gold.intel_vector_analysis RESTART IDENTITY"))

        conn.execute(text("""
            INSERT INTO gold.intel_vector_analysis (
                vuln_id, source_type, cvss_version, full_vector,
                attack_vector, published_year, is_primary
            )
            SELECT m.cve_id, 'NVD', m.cvss_version,
                   CASE WHEN m.vector_string LIKE 'AV:%'
                        THEN 'CVSS:2.0/' || m.vector_string
                        ELSE m.vector_string END,
                   m.attack_vector, EXTRACT(YEAR FROM v.published)::INT, m.type = 'Primary'
            FROM silver.cve_metrics m
            JOIN silver.cve_vulnerabilities v ON m.cve_id = v.id
            ON CONFLICT (vuln_id, full_vector) DO NOTHING
        """))

        nvd_count = conn.execute(text(
            "SELECT COUNT(*) FROM gold.intel_vector_analysis WHERE source_type = 'NVD'"
        )).scalar() or 0
        logger.info(gold_step(2, f"NVD vectors: inserted {format_count(nvd_count)} (SQL)"))

        osv_inserted = conn.execute(text("SELECT gold.insert_osv_vector_analysis()")).scalar() or 0
        logger.info(gold_step(2, f"OSV vectors: inserted {format_count(osv_inserted)} (SQL)"))

        total_vectors = conn.execute(text(
            "SELECT COUNT(*) FROM gold.intel_vector_analysis"
        )).scalar() or 0

    logger.info(gold_step(2, f"Completed. {format_count(total_vectors)} vectors indexed (100.0%)"))


def run_step_3_cwe_sync():
    """Step 3/5: CWE Classification"""
    logger.info(gold_step(3, "CWE Classification — starting"))

    db = Database()
    classifier = CWEDassifier(db)

    with get_engine().connect() as conn:
        res = conn.execute(text(
            "SELECT DISTINCT cwe_id FROM silver.cve_weaknesses WHERE cwe_id LIKE 'CWE-%'"
        ))
        db_cwe_ids = [r[0] for r in res]

    targets = set()
    for cid in db_cwe_ids:
        try:
            targets.add(int(cid.split('-')[1]))
        except (ValueError, IndexError):
            pass
    for i in range(1, 1550):
        targets.add(i)

    target_list = sorted(targets)
    total_targets = len(target_list)
    logger.info(gold_step(3, f"Targets: {format_count(total_targets)} CWE entries"))

    insert_data = []
    for idx, cwe_num in enumerate(target_list):
        if should_log_progress(idx + 1, CWE_PROGRESS_INTERVAL) or (idx + 1) == total_targets:
            logger.info(gold_step(3, format_progress(idx + 1, total_targets)))

        try:
            cwe_obj = db.get(cwe_num)
        except Exception:
            continue
        if not cwe_obj:
            continue

        pillar = classifier.classify(cwe_num)
        insert_data.append({
            "cwe_id": f"CWE-{cwe_num}",
            "name": cwe_obj.name,
            "pillar": pillar,
            "description": getattr(cwe_obj, 'description', ''),
        })

    synced_count = len(insert_data)
    if insert_data:
        with get_engine().begin() as conn:
            logger.info(gold_step(3, "Truncating gold.cwe_definitions"))
            conn.execute(text("TRUNCATE TABLE gold.cwe_definitions"))
            chunk_size = 1000
            for i in range(0, synced_count, chunk_size):
                conn.execute(text("""
                    INSERT INTO gold.cwe_definitions (cwe_id, name, pillar, description)
                    VALUES (:cwe_id, :name, :pillar, :description)
                    ON CONFLICT (cwe_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        pillar = EXCLUDED.pillar,
                        description = EXCLUDED.description,
                        created_at = CURRENT_TIMESTAMP
                """), insert_data[i:i + chunk_size])

    logger.info(gold_step(3, format_completed(synced_count, total_targets, "synced")))


def run_step_4_snapshots():
    """Step 4/5: Dashboard Snapshots + Explorer MV"""
    logger.info(gold_step(4, "Dashboard Snapshots — starting"))
    total_tables = len(SNAPSHOT_TABLES)

    with get_engine().begin() as conn:
        for idx, (table, view) in enumerate(SNAPSHOT_TABLES.items(), start=1):
            short_name = table.replace("gold.", "")
            conn.execute(text(f"TRUNCATE TABLE {table}"))
            conn.execute(text(
                f"INSERT INTO {table} SELECT *, NOW() as last_updated_at FROM {view}"
            ))
            logger.info(gold_step(4, f"Progress: {idx} / {total_tables} tables ({short_name})"))

        logger.info(gold_step(4, "Refreshing Explorer Materialized View..."))
        conn.execute(text("REFRESH MATERIALIZED VIEW gold.v_explorer_inventory"))

    logger.info(gold_step(
        4,
        f"Completed. {total_tables} snapshots + explorer refreshed (100.0%)"
    ))


def run_step_5_summary_metrics():
    """Step 5/5: Summary Metrics"""
    logger.info(gold_step(5, "Summary Metrics — starting"))

    try:
        with get_engine().begin() as conn:
            res = conn.execute(text("SELECT * FROM gold.v_intel_summary")).fetchone()
            if res:
                keys = [
                    'total_intelligence', 'active_exploits', 'critical_weaknesses',
                    'new_discoveries', 'recent_updates', 'unpatched_threats',
                    'analysis_backlog', 'intelligence_span',
                ]
                update_params = [{"val": res[i], "key": key} for i, key in enumerate(keys)]
                conn.execute(text(
                    "UPDATE gold.intel_summary SET metric_value = :val, "
                    "last_updated_at = NOW() WHERE metric_key = :key"
                ), update_params)
                logger.info(gold_step(5, f"Updated {len(keys)} intel_summary keys"))

            mark_gold_refreshed(conn)

        logger.info(gold_step(5, "Completed. Gold summary metrics refreshed (100.0%)"))
    except Exception as e:
        logger.error(gold_step(5, f"Failed to refresh summary metrics: {exc_type_name(e)}"))
        raise


def refresh_gold_metrics():
    """Gold 레이어 전체 지표 최신화 오케스트레이션"""
    logger.info("Starting Gold Analytics: Silver → Gold")
    logger.info("Strategy: full refresh (snapshot)")

    with get_engine().begin() as conn:
        conn.execute(text("TRUNCATE TABLE gold.intel_osv_scores"))

    run_step_1_osv_enrichment()
    run_step_2_vector_analysis()
    run_step_3_cwe_sync()
    run_step_4_snapshots()
    run_step_5_summary_metrics()

    logger.info("Gold Analytics completed. 5/5 steps finished.")

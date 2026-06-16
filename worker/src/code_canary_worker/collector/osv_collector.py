import os
import requests
import logging
from datetime import datetime, timezone
from code_canary_worker.utils.staging_constants import OSV_BASELINE_PREFIX
from code_canary_worker.utils.db_manager import SessionLocal
from code_canary_worker.utils.ingestion_sync import upsert_collection_sync
from code_canary_worker.utils.staging_paths import osv_data_dir
from code_canary_worker.utils.staging_manifest import build_osv_manifest_from_zip
from code_canary_worker.utils.job_cancellation import JobCancelledError, raise_if_cancel_requested
from code_canary_worker.utils.log_sanitize import exc_type_name

logger = logging.getLogger("CodeCanary.OSV")

OSV_URL = os.getenv("OSV_API_URL", "https://osv-vulnerabilities.storage.googleapis.com/all.zip")
SAVE_DIR = osv_data_dir()


def download_osv_all():
    """OSV 전체 데이터를 ZIP 파일로 다운로드 (하위 폴더 없이 data/osv에 바로 저장)"""
    # 수집 시작 시간 고정
    start_time = datetime.now(timezone.utc)
    timestamp_suffix = start_time.strftime("%Y%m%d_%H%M%S")

    db = SessionLocal()
    try:
        upsert_collection_sync(db, "OSV", status="running", touch_collected_at=True)
        db.commit()
    
        if not os.path.exists(SAVE_DIR):
            os.makedirs(SAVE_DIR)
            logger.info(f"Created directory: {SAVE_DIR}")

        # 파일명 규칙 적용: OSV_BASELINE_{날짜}_{시간}.zip
        filename = f"{OSV_BASELINE_PREFIX}{timestamp_suffix}.zip"
        save_path = os.path.join(SAVE_DIR, filename)

        logger.info(f"OSV Download Started. Target Path: {save_path}")
        with requests.get(OSV_URL, stream=True, timeout=300) as r:
            r.raise_for_status()
            
            total_size = int(r.headers.get('content-length', 0))
            downloaded = 0
            last_reported_progress = -1  # 마지막으로 보고된 퍼센트 저장
            
            with open(save_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    raise_if_cancel_requested()
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        if total_size > 0:
                            # 1% 단위로 정수값 계산
                            current_pct = int(downloaded / total_size * 100)
                            
                            # 마지막 보고 퍼센트보다 커졌을 때만 출력 (최대 100번만 출력됨)
                            if current_pct > last_reported_progress:
                                # 10% 단위로 찍고 싶다면 아래처럼 조건을 추가
                                if current_pct % 10 == 0:
                                    logger.info(f"Download progress: {current_pct}%")
                                last_reported_progress = current_pct
            
        logger.info(f"OSV File successfully saved to: {save_path}")
        build_osv_manifest_from_zip(save_path, filename, logger=logger)
        upsert_collection_sync(
            db,
            "OSV",
            status="idle",
            records_touched=downloaded if downloaded > 0 else 1,
            touch_collected_at=False,
        )
        db.commit()
    except JobCancelledError:
        db.rollback()
        upsert_collection_sync(db, "OSV", status="failed", touch_collected_at=False)
        db.commit()
        raise
    except Exception as e:
        db.rollback()
        upsert_collection_sync(db, "OSV", status="failed", touch_collected_at=False)
        db.commit()
        logger.error("OSV Download Critical Error: %s", exc_type_name(e))
        raise
    finally:
        db.close()

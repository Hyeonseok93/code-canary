import logging
import sys
import time
from datetime import datetime, timezone

from code_canary_worker.utils.log_sanitize import exc_type_name
from code_canary_worker.utils.paths import worker_root

MENU_WIDTH = 60


def setup_logger() -> logging.Logger:
    log_dir = worker_root() / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("CodeCanary")
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    log_file = log_dir / f"app_{datetime.now(timezone.utc).strftime('%Y%m%d')}.log"
    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    return logger


log = setup_logger()


def pause_before_menu(message="\n✅ Task Finished. Press Enter to return to menu..."):
    """작업 완료 후 메뉴 복귀 전 대기. 비대화형 터미널(EOF)에서도 메시지가 보이도록 처리."""
    print(message, flush=True)
    try:
        input()
    except EOFError:
        print("\n⚠️  Input not available — returning to menu in 3 seconds...", flush=True)
        time.sleep(3)


def display_menu():
    from code_canary_worker.core.tasks import MENU_SECTIONS, STEP_LABELS

    print("\033c", end="", flush=True)
    print("=" * MENU_WIDTH)
    print("        🚀 CODE CANARY: VULNERABILITY WORKER")
    print("=" * MENU_WIDTH)

    for section_index, (section_name, section_items) in enumerate(MENU_SECTIONS):
        if section_index > 0:
            print("-" * MENU_WIDTH)
        print(f"  {section_name}")
        for key, step_key in section_items:
            label = STEP_LABELS.get(step_key, step_key)
            print(f"    [{key}] {label}")

    print("-" * MENU_WIDTH)
    print("  Tools")
    print("    [R] Run Admin Job Queue (code-canary-worker loop)")
    print("    [Q] Exit Console")
    print("=" * MENU_WIDTH)
    print("  Load / NVD Collect: options prompted before run (same as Admin).")


def _prompt_collect_mode() -> str:
    print("\nNVD Collect mode:")
    print("  [1] Full catalog (default)")
    print("  [2] Incremental")
    choice = input("Select [1/2]: ").strip()
    if choice in {"", "1"}:
        return "full"
    if choice == "2":
        return "incremental"
    print("Invalid choice — using Full catalog.")
    return "full"


def _prompt_staging_ref(step_key: str) -> str | None:
    from code_canary_worker.utils.staging_baselines import list_nvd_baselines, list_osv_baselines

    baselines = list_nvd_baselines() if step_key == "nvd-load" else list_osv_baselines()
    print("\nStaging baseline:")
    print("  [0] Latest baseline (auto)")
    for index, baseline_id in enumerate(baselines, start=1):
        print(f"  [{index}] {baseline_id}")

    if not baselines:
        print("  (no baselines found — will use latest when available)")
        return None

    choice = input("Select baseline [0]: ").strip()
    if choice in {"", "0"}:
        return None

    if choice.isdigit():
        selected_index = int(choice)
        if 1 <= selected_index <= len(baselines):
            return baselines[selected_index - 1]

    print("Invalid choice — using latest baseline.")
    return None


def _resolve_step_options(step_key: str) -> tuple[str | None, str | None]:
    from code_canary_worker.core.tasks import LOAD_STEPS, NVD_COLLECT_STEP

    staging_ref = None
    collect_mode = None

    if step_key == NVD_COLLECT_STEP:
        collect_mode = _prompt_collect_mode()
    elif step_key in LOAD_STEPS:
        staging_ref = _prompt_staging_ref(step_key)

    return staging_ref, collect_mode


def main():
    from code_canary_worker.core.tasks import MENU_CHOICES, menu_label, run_step

    while True:
        display_menu()
        try:
            try:
                choice = input("\n🎯 Select Menu: ").strip().upper()
            except KeyboardInterrupt:
                print("\n\n👋 Exiting Code Canary Engine. Goodbye!")
                sys.exit(0)

            step_key = MENU_CHOICES.get(choice)
            if step_key:
                staging_ref, collect_mode = _resolve_step_options(step_key)
                log.info("Starting %s...", menu_label(choice))
                if staging_ref:
                    log.info("Staging baseline: %s", staging_ref)
                if collect_mode:
                    log.info("Collect mode: %s", collect_mode)
                run_step(step_key, staging_ref=staging_ref, collect_mode=collect_mode)
                pause_before_menu()
                continue

            if choice == "R":
                log.info("Starting admin job runner loop...")
                from code_canary_worker.runner import main as run_worker_loop

                run_worker_loop()
                pause_before_menu("\nRunner stopped. Press Enter to return to menu...")

            elif choice == "Q":
                print("\n👋 Exiting Code Canary Engine. Goodbye!")
                sys.exit(0)
            elif choice == "":
                continue
            else:
                print(f"❌ '{choice}' is an invalid choice.", flush=True)
                pause_before_menu("\nPress Enter to return to menu...")

        except KeyboardInterrupt:
            print("\n\n⚠️  Operation cancelled by user. Returning to menu...", flush=True)
            log.warning("Task interrupted by user.")
            pause_before_menu("\nPress Enter to return to menu...")

        except Exception as e:
            log.error("Unexpected Console Error: %s", exc_type_name(e))
            pause_before_menu("\n❌ An error occurred. Press Enter to return to menu...")


if __name__ == "__main__":
    main()

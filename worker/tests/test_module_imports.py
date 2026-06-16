import importlib
import pkgutil

import code_canary_worker


def test_worker_package_imports():
    importlib.import_module("code_canary_worker.runner")
    importlib.import_module("code_canary_worker.core.tasks")
    importlib.import_module("code_canary_worker.collector.nvd_collector")
    importlib.import_module("code_canary_worker.collector.osv_collector")
    importlib.import_module("code_canary_worker.loader.nvd_loader")
    importlib.import_module("code_canary_worker.loader.osv_loader")
    importlib.import_module("code_canary_worker.refinery.silver_refinery")
    importlib.import_module("code_canary_worker.refinery.gold_refinery")


def test_all_worker_submodules_importable():
    prefix = code_canary_worker.__name__ + "."
    for module_info in pkgutil.walk_packages(code_canary_worker.__path__, prefix):
        importlib.import_module(module_info.name)

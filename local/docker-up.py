#!/usr/bin/env python3
"""Prepares Docker secrets from repo-root .env, then runs local/docker-compose.yml."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

LOCAL_DIR = Path(__file__).resolve().parent
SCRIPT = LOCAL_DIR / "docker-up.sh"


def main() -> int:
    cmd = ["sh", str(SCRIPT), *sys.argv[1:]]
    result = subprocess.run(cmd, cwd=LOCAL_DIR)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())

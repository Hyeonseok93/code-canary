"""Staging baseline naming — keep in sync with PipelineStagingConstants.java."""

import re

NVD_BASELINE_PREFIX = "NVD_BASELINE_"
OSV_BASELINE_PREFIX = "OSV_BASELINE_"
NVD_BASELINE_PATTERN = re.compile(r"^NVD_BASELINE_\d{8}_\d{6}$")
OSV_BASELINE_PATTERN = re.compile(r"^OSV_BASELINE_\d{8}_\d{6}\.zip$")

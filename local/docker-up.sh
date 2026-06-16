#!/usr/bin/env sh
set -eu

LOCAL_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
ROOT="$(CDPATH= cd -- "$LOCAL_DIR/.." && pwd)"

"$LOCAL_DIR/prepare-docker-secrets.sh"

if [ "$#" -eq 0 ]; then
  set -- up -d --build
fi

cd "$LOCAL_DIR"
exec docker compose --env-file "$ROOT/.env" "$@"

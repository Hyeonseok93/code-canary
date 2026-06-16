#!/usr/bin/env sh
set -eu

LOCAL_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
ROOT="$(CDPATH= cd -- "$LOCAL_DIR/.." && pwd)"
ENV_FILE="$ROOT/.env"
SECRETS_DIR="$LOCAL_DIR/.docker-secrets"

if [ ! -f "$ENV_FILE" ]; then
  echo ".env not found at $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$SECRETS_DIR"

write_secret() {
  target="$1"
  value="$2"
  if [ -d "$target" ]; then
    rm -rf "$target"
  fi
  printf '%s' "$value" > "$target"
}

# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a

if [ -z "${DB_PASSWORD:-}" ] || [ -z "${JWT_SECRET:-}" ] || [ -z "${REDIS_PASSWORD:-}" ]; then
  echo "DB_PASSWORD, JWT_SECRET, and REDIS_PASSWORD must be set in .env" >&2
  exit 1
fi

# JWT HS256 requires at least 32 UTF-8 bytes (see JwtTokenProvider.MIN_KEY_BYTES).
if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "JWT_SECRET must be at least 32 characters in .env (got ${#JWT_SECRET})." >&2
  exit 1
fi

write_secret "$SECRETS_DIR/db_password" "$DB_PASSWORD"
write_secret "$SECRETS_DIR/jwt_secret" "$JWT_SECRET"
write_secret "$SECRETS_DIR/redis_password" "$REDIS_PASSWORD"

echo "Docker secrets prepared in local/.docker-secrets/"

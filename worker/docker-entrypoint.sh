#!/bin/sh
set -eu

if [ -f /run/secrets/db_password ]; then
  export DB_PASSWORD="$(tr -d '\r\n' < /run/secrets/db_password)"
fi

exec "$@"

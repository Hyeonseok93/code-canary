#!/bin/sh
set -eu

if [ -f /run/secrets/db_password ]; then
  export DB_PASSWORD="$(tr -d '\r\n' < /run/secrets/db_password)"
fi

if [ -f /run/secrets/jwt_secret ]; then
  export JWT_SECRET="$(tr -d '\r\n' < /run/secrets/jwt_secret)"
fi

if [ -f /run/secrets/redis_password ]; then
  export REDIS_PASSWORD="$(tr -d '\r\n' < /run/secrets/redis_password)"
fi

exec java -jar app.jar

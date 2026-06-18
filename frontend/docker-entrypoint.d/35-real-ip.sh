#!/bin/sh
set -eu

CONF="/etc/nginx/nginx.conf"
CIDRS="${NGINX_TRUSTED_PROXY_CIDRS:-}"

if [ -n "$CIDRS" ]; then
  REAL_IP=""
  OLDIFS="$IFS"
  IFS=','
  for cidr in $CIDRS; do
    trimmed=$(echo "$cidr" | tr -d ' ')
    if [ -n "$trimmed" ]; then
      REAL_IP="$REAL_IP    set_real_ip_from $trimmed;\n"
    fi
  done
  IFS="$OLDIFS"
  REAL_IP="$REAL_IP    real_ip_header X-Forwarded-For;\n    real_ip_recursive on;"
else
  REAL_IP=""
fi

awk -v real_ip="$REAL_IP" '{
  gsub(/# REAL_IP_INSERT/, real_ip);
  print
}' "$CONF" > /tmp/nginx.conf
mv /tmp/nginx.conf "$CONF"

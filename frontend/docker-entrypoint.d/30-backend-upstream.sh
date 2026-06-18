#!/bin/sh
set -eu

CONF="/etc/nginx/nginx.conf"
UPSTREAM="${NGINX_BACKEND_UPSTREAM:-backend:8080}"

awk -v upstream="$UPSTREAM" '{
  gsub(/http:\/\/backend:8080/, "http://" upstream);
  print
}' "$CONF" > /tmp/nginx.conf
mv /tmp/nginx.conf "$CONF"

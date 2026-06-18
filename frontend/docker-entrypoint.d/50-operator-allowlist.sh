#!/bin/sh
set -eu

CONF="/etc/nginx/nginx.conf"
CIDRS="${NGINX_OPERATOR_CIDRS:-}"

if [ -n "$CIDRS" ]; then
  GEO="geo \$operator_allow {\n    default 0;"
  OLDIFS="$IFS"
  IFS=','
  for cidr in $CIDRS; do
    trimmed=$(echo "$cidr" | tr -d ' ')
    if [ -n "$trimmed" ]; then
      GEO="$GEO\n    $trimmed 1;"
    fi
  done
  IFS="$OLDIFS"
  GEO="$GEO\n}"
  DENY='            if ($operator_allow = 0) { return 403; }'
else
  GEO="geo \$operator_allow {\n    default 1;\n}"
  DENY=""
fi

awk -v geo="$GEO" -v deny="$DENY" '
{
  gsub(/# OPERATOR_GEO_INSERT/, geo);
  gsub(/# OPERATOR_DENY_INSERT/, deny);
  print
}
' "$CONF" > /tmp/nginx.conf
mv /tmp/nginx.conf "$CONF"

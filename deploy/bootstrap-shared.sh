#!/usr/bin/env bash
# One-shot shared-EC2 bootstrap for Nabbi / be-u (requires sudo).
# - Points host nginx Nabbi vhosts at 127.0.0.1:3020
# - Starts the Compose stack
#
# Usage: sudo ./deploy/bootstrap-shared.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo $0" >&2
  exit 1
fi

RUN_USER="${SUDO_USER:-spotynet}"

echo "==> Applying host nginx Nabbi gateway (3020)"
bash "$ROOT/deploy/apply-nginx.sh"

echo "==> Ensuring ${RUN_USER} is in docker group"
usermod -aG docker "$RUN_USER" 2>/dev/null || true

echo "==> Starting Compose as ${RUN_USER}"
cd "$ROOT"
if id -nG "$RUN_USER" 2>/dev/null | grep -qw docker; then
  runuser -u "$RUN_USER" -- env HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)" \
    bash -lc "cd '$ROOT' && ./dev.sh"
else
  # Group just added — run compose as root this once
  export NABBI_WEB_HOST="nabbi-dev.spotynet.com"
  export NABBI_API_HOST="nabbi-api-dev.spotynet.com"
  export NABBI_MOBILE_HOST="nabbi-mobile-dev.spotynet.com"
  export BACKEND_ORIGIN="http://api:3007"
  export NEXT_PUBLIC_BACKEND_ORIGIN="http://api:3007"
  export NEXT_PUBLIC_API_URL="https://nabbi-api-dev.spotynet.com/api"
  export EXPO_PUBLIC_API_URL="https://nabbi-api-dev.spotynet.com"
  pm2 delete nabbi-api-dev nabbi-dev nabbi-mobile-dev 2>/dev/null || true
  docker compose -f compose.yaml up -d --build
fi

echo
echo "==> Status"
docker compose -f "$ROOT/compose.yaml" ps
echo
echo "Gateway checks:"
echo "  curl -I -H 'Host: nabbi-dev.spotynet.com' http://127.0.0.1:3020/"
echo "  curl -I -H 'Host: nabbi-api-dev.spotynet.com' http://127.0.0.1:3020/"
echo "  curl -I -H 'Host: nabbi-mobile-dev.spotynet.com' http://127.0.0.1:3020/"
echo
echo "Note: if docker group was just added for ${RUN_USER}, re-login (or newgrp docker)."

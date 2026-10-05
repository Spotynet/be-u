#!/usr/bin/env bash
# Nabbi / be-u PRODUCTION deploy — dedicated machine (project nginx on host :80).
#
# After each merge to main:
#   ./deploy.sh
#
# Domains at top (edit once) or: ./deploy.sh web.example.com api.example.com mobile.example.com
# Secrets stay in backend/.env (gitignored).
#
# For shared-EC2 development, use ./dev.sh instead. Do NOT run this on the shared Spotynet EC2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# === Production domains (edit once; committed) ===
NABBI_WEB_HOST="be-u.ai"
NABBI_API_HOST="api.be-u.ai"
NABBI_MOBILE_HOST="app.be-u.ai"

compose() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  elif sudo -n docker info >/dev/null 2>&1; then
    sudo docker compose "$@"
  else
    echo "Docker needs privileges. Prefer: sudo usermod -aG docker \$USER && newgrp docker" >&2
    sudo docker compose "$@"
  fi
}

if [[ "${1:-}" == "down" ]]; then
  echo "Stopping Nabbi PRODUCTION..."
  compose -f compose.yaml -f compose.prod.yaml down
  exit 0
fi

if [[ $# -ge 3 ]]; then
  NABBI_WEB_HOST="$1"
  NABBI_API_HOST="$2"
  NABBI_MOBILE_HOST="$3"
elif [[ $# -ge 2 ]]; then
  NABBI_WEB_HOST="$1"
  NABBI_API_HOST="$2"
  NABBI_MOBILE_HOST="${3:-app.${1#*.}}"
fi

export NABBI_WEB_HOST NABBI_API_HOST NABBI_MOBILE_HOST
export BACKEND_ORIGIN="http://api:3007"
export NEXT_PUBLIC_BACKEND_ORIGIN="http://api:3007"
export NEXT_PUBLIC_API_URL="https://${NABBI_API_HOST}/api"
export EXPO_PUBLIC_API_URL="https://${NABBI_API_HOST}"

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env — create once (SECRET_KEY, DB_*, DEBUG=False, …)." >&2
  exit 1
fi

echo "Pulling latest from git..."
git pull --ff-only

echo "Deploying Nabbi PRODUCTION (compose.yaml + compose.prod.yaml → :80)..."
echo "  web:    ${NABBI_WEB_HOST}"
echo "  api:    ${NABBI_API_HOST}"
echo "  mobile: ${NABBI_MOBILE_HOST}"
compose -f compose.yaml -f compose.prod.yaml up -d --build
echo
compose -f compose.yaml -f compose.prod.yaml ps
echo
echo "PRODUCTION URLs (add TLS in front of :80 if needed):"
echo "  http://${NABBI_WEB_HOST}/"
echo "  http://${NABBI_API_HOST}/"
echo "  http://${NABBI_MOBILE_HOST}/"
echo
echo "Logs: docker compose -f compose.yaml -f compose.prod.yaml logs -f"
echo "Stop: ./deploy.sh down"

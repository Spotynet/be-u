#!/usr/bin/env bash
# Nabbi / be-u DEVELOPMENT — shared EC2 (project nginx on 127.0.0.1:3020).
#
# After initial host setup: sudo ./deploy/bootstrap-shared.sh (once)
# Day-to-day: ./dev.sh
#
# Release flow (separate machines/scripts):
#   ./dev.sh     → hot reload on this box
#   ./build.sh   → build + push images to ECR (builder/dev)
#   ./deploy.sh  → pull + run on prod
#
# Domains are defined below. Secrets stay in backend/.env.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# === Dev domains (committed; shared EC2) ===
NABBI_WEB_HOST="nabbi-dev.spotynet.com"
NABBI_API_HOST="nabbi-api-dev.spotynet.com"
NABBI_MOBILE_HOST="nabbi-mobile-dev.spotynet.com"

export NABBI_WEB_HOST NABBI_API_HOST NABBI_MOBILE_HOST
# Compose DNS: Next server-side rewrites → api service
export BACKEND_ORIGIN="http://api:3007"
export NEXT_PUBLIC_BACKEND_ORIGIN="http://api:3007"
export NEXT_PUBLIC_API_URL="https://${NABBI_API_HOST}/api"
export EXPO_PUBLIC_API_URL="https://${NABBI_API_HOST}"

compose() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  elif sudo -n docker info >/dev/null 2>&1; then
    sudo docker compose "$@"
  else
    echo "Docker needs privileges. Prefer: sudo usermod -aG docker \$USER && newgrp docker" >&2
    echo "First-time shared host: sudo ./deploy/bootstrap-shared.sh" >&2
    sudo docker compose "$@"
  fi
}

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env (DB, SECRET_KEY, …)." >&2
  exit 1
fi

# Host `next build` (or a mixed root/user cache) leaves a production .next that
# breaks `next dev --turbopack` with 500 / ENOENT on app-build-manifest.json.
# Wipe it before every start so the web container always regenerates a dev cache.
clear_web_next_cache() {
  local targets=()
  [[ -e web/.next ]] && targets+=(web/.next)
  # Leftovers from earlier recovery attempts
  shopt -s nullglob
  targets+=(web/.next-*)
  shopt -u nullglob
  if ((${#targets[@]} == 0)); then
    return 0
  fi
  echo "Clearing web/.next (dev uses turbopack; host production cache causes Internal Server Error)..."
  # Prefer a one-shot alpine container so root-owned files (compose web user 0:0) are removable without sudo.
  if docker info >/dev/null 2>&1; then
    docker run --rm -v "${ROOT}/web:/work" alpine:3.20 \
      sh -c 'rm -rf /work/.next /work/.next-*'
  elif sudo -n docker info >/dev/null 2>&1; then
    sudo docker run --rm -v "${ROOT}/web:/work" alpine:3.20 \
      sh -c 'rm -rf /work/.next /work/.next-*'
  else
    rm -rf "${targets[@]}" 2>/dev/null || true
    if [[ -e web/.next ]]; then
      echo "Could not fully remove web/.next (permission denied). Run:" >&2
      echo "  docker run --rm -v \"\$PWD/web:/work\" alpine:3.20 sh -c 'rm -rf /work/.next /work/.next-*'" >&2
      exit 1
    fi
  fi
}

echo "Cleaning old Nabbi PM2 processes (if any)..."
pm2 delete nabbi-api-dev 2>/dev/null || true
pm2 delete nabbi-dev 2>/dev/null || true
pm2 delete nabbi-mobile-dev 2>/dev/null || true
pm2 save 2>/dev/null || true

clear_web_next_cache

echo "Starting Nabbi DEV (compose.yaml → 127.0.0.1:3020)..."
echo "  web:    ${NABBI_WEB_HOST}"
echo "  api:    ${NABBI_API_HOST}"
echo "  mobile: ${NABBI_MOBILE_HOST}"
compose -f compose.yaml up -d --build
echo
compose -f compose.yaml ps
echo
echo "DEV URLs (via host nginx TLS):"
echo "  https://${NABBI_WEB_HOST}/"
echo "  https://${NABBI_API_HOST}/"
echo "  https://${NABBI_MOBILE_HOST}/"
echo
echo "Logs: docker compose -f compose.yaml logs -f"
echo "Stop: docker compose -f compose.yaml down"
echo
echo "If host nginx still points at 3007/3008/3009, run once:"
echo "  sudo ./deploy/apply-nginx.sh"

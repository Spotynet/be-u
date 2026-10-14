#!/usr/bin/env bash
# Nabbi / be-u PRODUCTION deploy — dedicated machine (project nginx on host :80).
#
# Pulls pre-built images from Amazon ECR (no build on host).
# Build/push images first with ./build.sh on a builder/dev machine.
#
#   NABBI_IMAGE_TAG=<sha|master> ./deploy.sh
#   ./deploy.sh be-u.ai api.be-u.ai app.be-u.ai
#   SKIP_GIT_PULL=1 NABBI_IMAGE_TAG=$SHA ./deploy.sh
#
# Non-secret registry config: deploy.env (see deploy.env.example).
# App secrets stay in backend/.env (gitignored).
# For development, use ./dev.sh. Do NOT run this on the shared Spotynet EC2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# shellcheck source=deploy/lib-ecr.sh
source "$ROOT/deploy/lib-ecr.sh"

load_deploy_env "$ROOT"
resolve_ecr_registry

NABBI_IMAGE_TAG="${NABBI_IMAGE_TAG:-master}"

# === Production domains (edit once; committed defaults) ===
NABBI_WEB_HOST="${NABBI_WEB_HOST:-be-u.ai}"
NABBI_API_HOST="${NABBI_API_HOST:-api.be-u.ai}"
NABBI_MOBILE_HOST="${NABBI_MOBILE_HOST:-app.be-u.ai}"

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
export NABBI_IMAGE_REGISTRY NABBI_IMAGE_TAG AWS_REGION
export BACKEND_ORIGIN="http://api:3007"
export NEXT_PUBLIC_BACKEND_ORIGIN="https://${NABBI_API_HOST}"
export NEXT_PUBLIC_API_URL="https://${NABBI_API_HOST}/api"
export EXPO_PUBLIC_API_URL="https://${NABBI_API_HOST}"

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env — create once (SECRET_KEY, DB_*, DEBUG=False, …)." >&2
  exit 1
fi

if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  echo "Pulling latest from git..."
  git pull --ff-only
fi

echo "Deploying Nabbi PRODUCTION (pull ECR images → :80)..."
echo "  registry: ${NABBI_IMAGE_REGISTRY}"
echo "  tag:      ${NABBI_IMAGE_TAG}"
echo "  web:      ${NABBI_WEB_HOST}"
echo "  api:      ${NABBI_API_HOST}"
echo "  mobile:   ${NABBI_MOBILE_HOST}"

ecr_login

echo "Pulling images..."
if ! compose -f compose.yaml -f compose.prod.yaml pull api web mobile nginx; then
  echo "Image pull failed. Check EC2 instance role ECR pull permissions (see deploy/aws-ecr.md)." >&2
  exit 1
fi

echo "Starting stack..."
compose -f compose.yaml -f compose.prod.yaml up -d --remove-orphans
echo
echo "Running database migrations..."
compose -f compose.yaml -f compose.prod.yaml exec -T api \
  python manage.py migrate --noinput
echo
compose -f compose.yaml -f compose.prod.yaml ps
echo
echo "PRODUCTION URLs (add TLS in front of :80 if needed):"
echo "  http://${NABBI_WEB_HOST}/"
echo "  http://${NABBI_API_HOST}/"
echo "  http://${NABBI_MOBILE_HOST}/"
echo
echo "Rollback: NABBI_IMAGE_TAG=<previous_sha> ./deploy.sh"
echo "Logs: docker compose -f compose.yaml -f compose.prod.yaml logs -f"
echo "Stop: ./deploy.sh down"

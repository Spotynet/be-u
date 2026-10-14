#!/usr/bin/env bash
# Nabbi / be-u — build production images and push to Amazon ECR.
#
# Run on a builder/dev machine (Docker + AWS CLI + ECR push IAM). Prefer not on prod.
#
#   ./build.sh
#   NABBI_IMAGE_TAG=v1.2.3 ./build.sh
#   PUSH=0 ./build.sh                          # build/tag only (any branch OK)
#
# Push to ECR is only allowed on the repo default branch (origin/HEAD, currently
# master). Override only in emergencies: ALLOW_NON_DEFAULT_BRANCH=1 ./build.sh
#
# Requires deploy.env with AWS_ACCOUNT_ID (see deploy.env.example).
# After push, on prod: NABBI_IMAGE_TAG=<tag> ./deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# shellcheck source=deploy/lib-ecr.sh
source "$ROOT/deploy/lib-ecr.sh"

load_deploy_env "$ROOT"
resolve_ecr_registry

# Default branch from remote (falls back to master)
DEFAULT_BRANCH="$(git symbolic-ref -q refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-master}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

PUSH="${PUSH:-1}"
ALLOW_NON_DEFAULT_BRANCH="${ALLOW_NON_DEFAULT_BRANCH:-0}"
SKIP_BRANCH_TAG="${SKIP_BRANCH_TAG:-0}"
# Back-compat alias
if [[ "${SKIP_MASTER_TAG:-0}" == "1" ]]; then
  SKIP_BRANCH_TAG=1
fi

if [[ "$PUSH" == "1" && "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" && "$ALLOW_NON_DEFAULT_BRANCH" != "1" ]]; then
  echo "Refusing to push ECR images from branch '${CURRENT_BRANCH}'." >&2
  echo "Checkout the default branch '${DEFAULT_BRANCH}' first (keeps git and images aligned)." >&2
  echo "Local-only build: PUSH=0 ./build.sh" >&2
  echo "Emergency override: ALLOW_NON_DEFAULT_BRANCH=1 ./build.sh" >&2
  exit 1
fi

# Tag: explicit env, else full git SHA
if [[ -z "${NABBI_IMAGE_TAG:-}" ]]; then
  NABBI_IMAGE_TAG="$(git rev-parse HEAD)"
fi

# Public URLs baked into web/mobile client bundles at build time
NABBI_API_HOST="${NABBI_API_HOST:-api.be-u.ai}"
BACKEND_ORIGIN="${BACKEND_ORIGIN:-http://api:3007}"
NEXT_PUBLIC_BACKEND_ORIGIN="${NEXT_PUBLIC_BACKEND_ORIGIN:-https://${NABBI_API_HOST}}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://${NABBI_API_HOST}/api}"
EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://${NABBI_API_HOST}}"

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  elif sudo -n docker info >/dev/null 2>&1; then
    sudo docker "$@"
  else
    echo "Docker needs privileges. Prefer: sudo usermod -aG docker \$USER && newgrp docker" >&2
    sudo docker "$@"
  fi
}

echo "Building Nabbi images for ECR..."
echo "  branch:   ${CURRENT_BRANCH} (default: ${DEFAULT_BRANCH})"
echo "  registry: ${NABBI_IMAGE_REGISTRY}"
echo "  tag:      ${NABBI_IMAGE_TAG}"
echo "  api host: ${NABBI_API_HOST}"

build_one() {
  local name="$1"
  local dockerfile="$2"
  local target="${3:-}"
  local image="${NABBI_IMAGE_REGISTRY}/${name}"
  local -a args=(
    build
    -f "$dockerfile"
    -t "${image}:${NABBI_IMAGE_TAG}"
  )
  if [[ -n "$target" ]]; then
    args+=(--target "$target")
  fi
  args+=(
    --build-arg "BACKEND_ORIGIN=${BACKEND_ORIGIN}"
    --build-arg "NEXT_PUBLIC_BACKEND_ORIGIN=${NEXT_PUBLIC_BACKEND_ORIGIN}"
    --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
    --build-arg "EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}"
    .
  )
  echo "==> ${name}"
  docker_cmd "${args[@]}"
  if [[ "$SKIP_BRANCH_TAG" != "1" && "${NABBI_IMAGE_TAG}" != "${DEFAULT_BRANCH}" ]]; then
    docker_cmd tag "${image}:${NABBI_IMAGE_TAG}" "${image}:${DEFAULT_BRANCH}"
  fi
}

build_one api docker/api/Dockerfile
build_one web docker/web/Dockerfile production
build_one mobile docker/mobile/Dockerfile production

if [[ "$PUSH" != "1" ]]; then
  echo "PUSH=0 — skipping ECR login/push."
  echo "Local tags: ${NABBI_IMAGE_REGISTRY}/{api,web,mobile}:${NABBI_IMAGE_TAG}"
  exit 0
fi

ecr_login

push_one() {
  local name="$1"
  local image="${NABBI_IMAGE_REGISTRY}/${name}"
  echo "==> push ${name}:${NABBI_IMAGE_TAG}"
  docker_cmd push "${image}:${NABBI_IMAGE_TAG}"
  if [[ "$SKIP_BRANCH_TAG" != "1" && "${NABBI_IMAGE_TAG}" != "${DEFAULT_BRANCH}" ]]; then
    echo "==> push ${name}:${DEFAULT_BRANCH}"
    docker_cmd push "${image}:${DEFAULT_BRANCH}"
  fi
}

push_one api
push_one web
push_one mobile

echo
echo "Pushed:"
echo "  ${NABBI_IMAGE_REGISTRY}/api:${NABBI_IMAGE_TAG}"
echo "  ${NABBI_IMAGE_REGISTRY}/web:${NABBI_IMAGE_TAG}"
echo "  ${NABBI_IMAGE_REGISTRY}/mobile:${NABBI_IMAGE_TAG}"
if [[ "$SKIP_BRANCH_TAG" != "1" && "${NABBI_IMAGE_TAG}" != "${DEFAULT_BRANCH}" ]]; then
  echo "  (+ :${DEFAULT_BRANCH} on each)"
fi
echo
echo "On prod:"
echo "  NABBI_IMAGE_TAG=${NABBI_IMAGE_TAG} ./deploy.sh"
echo "  # or: ./deploy.sh   # uses :${DEFAULT_BRANCH} if that is NABBI_IMAGE_TAG in deploy.env"

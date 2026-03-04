#!/bin/bash
# Deploy backend to EC2 and/or EAS update (preview).
# Usage: ./scripts/deploy.sh [message]
#        ./scripts/deploy.sh --backend-only
#        ./scripts/deploy.sh --mobile-only
#        ./scripts/deploy.sh --no-migrate

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

BACKEND_ONLY=false
MOBILE_ONLY=false
NO_MIGRATE=false
EAS_MESSAGE=""

# Parse flags and optional message
for arg in "$@"; do
  case "$arg" in
    --backend-only)  BACKEND_ONLY=true ;;
    --mobile-only)   MOBILE_ONLY=true ;;
    --no-migrate)    NO_MIGRATE=true ;;
    *)
      if [[ "$arg" != --* ]] && [[ -z "$EAS_MESSAGE" ]]; then
        EAS_MESSAGE="$arg"
      fi
      ;;
  esac
done

# Load deploy.env if present
if [[ -f "$PROJECT_ROOT/deploy.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/deploy.env"
  set +a
fi

# Default EAS message
if [[ -z "$EAS_MESSAGE" ]]; then
  EAS_MESSAGE="Deploy $(date +%Y-%m-%d_%H-%M)"
fi

# --- Backend (EC2) ---
if [[ "$MOBILE_ONLY" != true ]]; then
  if [[ -z "${EC2_PEM:-}" ]] || [[ -z "${EC2_HOST:-}" ]]; then
    echo "Error: EC2_PEM and EC2_HOST are required for backend deploy. Set them in deploy.env or environment."
    exit 1
  fi

  EC2_USER="${EC2_USER:-ubuntu}"
  EC2_REPO_PATH="${EC2_REPO_PATH:-/home/ubuntu/be-u}"

  echo "Deploying backend to EC2..."
  if [[ "$NO_MIGRATE" == true ]]; then
    REMOTE_CMD="cd $EC2_REPO_PATH && git pull origin master && cd backend && source venv/bin/activate && pip install -r requirements.txt && pm2 restart all && sudo systemctl restart nginx.service"
  else
    REMOTE_CMD="cd $EC2_REPO_PATH && git pull origin master && cd backend && source venv/bin/activate && pip install -r requirements.txt && python manage.py makemigrations --merge && python manage.py makemigrations && python manage.py migrate --noinput && pm2 restart all && sudo systemctl restart nginx.service"
  fi

  ssh -i "$EC2_PEM" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "$REMOTE_CMD"
  echo "Backend deploy done."
fi

# --- Mobile (EAS) ---
if [[ "$BACKEND_ONLY" != true ]]; then
  echo "Running EAS update (branch: preview)..."
  EAS_ARGS=(--branch preview --message "$EAS_MESSAGE")
  (cd "$PROJECT_ROOT/mobile" && eas update "${EAS_ARGS[@]}")
  echo "EAS update done."
fi

echo "Deploy complete."

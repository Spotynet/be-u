#!/usr/bin/env bash
# Install host nginx site for Nabbi prod → 127.0.0.1:8080 (Compose).
# Usage (on dedicated prod EC2, as root):
#   sudo ./deploy/setup-prod-nginx.sh
#   sudo ./deploy/setup-prod-nginx.sh --certbot   # also request/renew via certbot
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/deploy/host-nginx.prod.conf"
DEST_AVAILABLE=/etc/nginx/sites-available/nabbi-prod.conf
DEST_ENABLED=/etc/nginx/sites-enabled/nabbi-prod.conf
DO_CERTBOT=0

if [[ "${1:-}" == "--certbot" ]]; then
  DO_CERTBOT=1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo $0 [--certbot]" >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi

apt-get update -qq
apt-get install -y nginx
if [[ "$DO_CERTBOT" == "1" ]]; then
  apt-get install -y certbot python3-certbot-nginx
fi

cp -a "$SRC" "$DEST_AVAILABLE"
ln -sfn "$DEST_AVAILABLE" "$DEST_ENABLED"

# Avoid default site fighting for server_name _
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "Host nginx OK → proxy to 127.0.0.1:8080 for be-u.ai / api.be-u.ai / app.be-u.ai"
echo "Ensure DNS A records point here, and Compose is up: ./deploy.sh"
echo "HTTP check: curl -sI -H 'Host: be-u.ai' http://127.0.0.1/ | head -3"

if [[ "$DO_CERTBOT" == "1" ]]; then
  echo
  echo "Requesting certificates (DNS must already point to this host)..."
  certbot --nginx \
    -d be-u.ai \
    -d api.be-u.ai \
    -d app.be-u.ai \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --redirect || {
      echo "certbot failed — fix DNS / ports 80+443, then re-run:" >&2
      echo "  sudo certbot --nginx -d be-u.ai -d api.be-u.ai -d app.be-u.ai" >&2
      exit 1
    }
  echo "TLS OK. Renewals: systemctl status certbot.timer"
fi

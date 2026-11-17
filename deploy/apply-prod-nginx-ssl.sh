#!/usr/bin/env bash
# Install nabbi.app HTTPS vhost (cert must already exist under /etc/letsencrypt/live/nabbi.app/).
# Usage on prod: sudo ./deploy/apply-prod-nginx-ssl.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/deploy/host-nginx.prod.ssl.conf"
DEST=/etc/nginx/sites-available/nabbi-prod.conf

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo $0" >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi

if [[ ! -f /etc/letsencrypt/live/nabbi.app/fullchain.pem ]]; then
  echo "Missing cert. Run first:" >&2
  echo "  sudo certbot certonly --nginx -d nabbi.app -d api.nabbi.app" >&2
  exit 1
fi

if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
  cat > /etc/letsencrypt/options-ssl-nginx.conf <<'OPTS'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
OPTS
fi

if [[ ! -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

cp -a "$SRC" "$DEST"
ln -sfn "$DEST" /etc/nginx/sites-enabled/nabbi-prod.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "OK. Test:"
echo "  curl -sI https://nabbi.app/ | head -5"
echo "  curl -sI https://api.nabbi.app/api/ | head -5"

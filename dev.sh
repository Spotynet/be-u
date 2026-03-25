#!/bin/bash
# Start nabbi dev servers via PM2
# Ports: API=3007, Web=3008, Mobile=3009

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
WEB_DIR="$SCRIPT_DIR/web"
MOBILE_DIR="$SCRIPT_DIR/mobile"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"

echo "Starting nabbi dev servers..."

# --- API (Django) on port 3007 ---
if pm2 describe nabbi-api-dev > /dev/null 2>&1; then
  echo "Restarting nabbi-api-dev..."
  pm2 restart nabbi-api-dev
else
  echo "Starting nabbi-api-dev on port 3007..."
  pm2 start "$VENV_PYTHON" \
    --name nabbi-api-dev \
    --cwd "$BACKEND_DIR" \
    -- manage.py runserver 0.0.0.0:3007
fi

# --- Web (Next.js) on port 3008 ---
if pm2 describe nabbi-web-dev > /dev/null 2>&1; then
  echo "Restarting nabbi-web-dev..."
  pm2 restart nabbi-web-dev
else
  echo "Starting nabbi-web-dev on port 3008..."
  pm2 start npm \
    --name nabbi-web-dev \
    --cwd "$WEB_DIR" \
    -- run dev -- -p 3008
fi

# --- Mobile (Expo web) on port 3009 ---
if pm2 describe nabbi-mobile-dev > /dev/null 2>&1; then
  echo "Restarting nabbi-mobile-dev..."
  pm2 restart nabbi-mobile-dev
else
  echo "Starting nabbi-mobile-dev on port 3009..."
  pm2 start bash \
    --name nabbi-mobile-dev \
    --cwd "$MOBILE_DIR" \
    -- -c "npx expo start --web --port 3009 --host lan"
fi

echo ""
pm2 list
echo ""
echo "nabbi-api-dev    -> http://localhost:3007  (nabbi-api-dev.spotynet.com)"
echo "nabbi-web-dev    -> http://localhost:3008  (nabbi-dev.spotynet.com)"
echo "nabbi-mobile-dev -> http://localhost:3009  (nabbi-mobile-dev.spotynet.com)"

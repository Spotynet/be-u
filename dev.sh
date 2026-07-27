#!/bin/bash

echo "🚀 Starting NABBI DEV (api + web + mobile)"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
WEB_DIR="$SCRIPT_DIR/web"
MOBILE_DIR="$SCRIPT_DIR/mobile"

BACKEND_NAME="nabbi-api-dev"
WEB_NAME="nabbi-dev"
MOBILE_NAME="nabbi-mobile-dev"

BACKEND_PORT=3007
WEB_PORT=3008
MOBILE_PORT=3009

# -------------------------
# 🧹 Clean old processes
# -------------------------
echo "🧹 Cleaning old PM2 processes..."
pm2 delete $BACKEND_NAME 2>/dev/null
pm2 delete $WEB_NAME 2>/dev/null
pm2 delete $MOBILE_NAME 2>/dev/null

# -------------------------
# 🐍 Start API (Django)
# -------------------------
echo "🐍 Starting Django API ($BACKEND_NAME) on port $BACKEND_PORT..."
pm2 start "$BACKEND_DIR/venv/bin/python" \
  --name "$BACKEND_NAME" \
  --cwd "$BACKEND_DIR" \
  -- manage.py runserver 0.0.0.0:$BACKEND_PORT

# -------------------------
# 🌐 Start Web (Next.js)
# -------------------------
echo "🌐 Starting Next.js web ($WEB_NAME) on port $WEB_PORT..."
pm2 start npm \
  --name "$WEB_NAME" \
  --cwd "$WEB_DIR" \
  -- run dev -- -p $WEB_PORT

# -------------------------
# 📱 Start Mobile (Expo web)
# -------------------------
echo "📱 Starting Expo mobile ($MOBILE_NAME) on port $MOBILE_PORT..."
pm2 start bash \
  --name "$MOBILE_NAME" \
  --cwd "$MOBILE_DIR" \
  -- -c "npx expo start --web --port $MOBILE_PORT --host localhost"

# -------------------------
# 💾 Save PM2 state
# -------------------------
pm2 save

# -------------------------
# 📊 Status
# -------------------------
echo "✅ NABBI DEV running:"
pm2 list
echo ""
echo "  nabbi-api-dev    -> https://nabbi-api-dev.spotynet.com    (localhost:$BACKEND_PORT)"
echo "  nabbi-dev        -> https://nabbi-dev.spotynet.com        (localhost:$WEB_PORT)"
echo "  nabbi-mobile-dev -> https://nabbi-mobile-dev.spotynet.com (localhost:$MOBILE_PORT)"

#!/bin/bash

echo "Starting Be-U Development Servers..."
echo

echo "Starting Django Backend on port 8000 (using .venv)..."
cd backend && source .venv/bin/activate && python run_server.py &
BACKEND_PID=$!

echo
echo "Starting Expo Mobile (web mode, -w)..."
cd ../mobile && npm run start -- -w &
MOBILE_PID=$!

echo
echo "Both servers are starting..."
echo "Backend API: http://localhost:8000/api/ (internal)"
echo "Mobile (Expo web -w): usually http://localhost:19006 or as shown in Expo logs"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait

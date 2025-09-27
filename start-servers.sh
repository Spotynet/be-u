#!/bin/bash

echo "Starting Be-U Development Servers..."
echo

echo "Starting Django Backend on port 8000..."
cd backend && python run_server.py &
BACKEND_PID=$!

echo
echo "Starting Next.js Frontend on port 3000..."
cd ../web && npm run dev &
FRONTEND_PID=$!

echo
echo "Both servers are starting..."
echo "Backend: http://localhost:8000/api/ (internal)"
echo "Frontend: http://localhost:3000/ (public)"
echo "API: http://localhost:3000/api/ (proxied)"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait

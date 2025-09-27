@echo off
echo Starting Be-U Development Servers...
echo.

echo Starting Django Backend on port 8000...
start "Django Backend" cmd /k "cd backend && python run_server.py"

echo.
echo Starting Next.js Frontend on port 3000...
start "Next.js Frontend" cmd /k "cd web && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000/api/ (internal)
echo Frontend: http://localhost:3000/ (public)
echo API: http://localhost:3000/api/ (proxied)
echo.
pause

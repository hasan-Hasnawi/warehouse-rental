@echo off
echo Starting Warehouse Rental Platform...
echo.

echo [1/2] Starting Backend (port 4000)...
start "Backend" cmd /c "cd /d "%~dp0backend" && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend (port 3000)...
start "Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo  Backend:  http://localhost:4000
echo  Frontend: http://localhost:3000
echo ========================================
echo.
echo Accounts:
echo  Admin:   admin@sotrage.com / admin123
echo  Client:  client@test.com   / test123  (demo client)
echo  Client:  client2@test.com  / client123 (test client with 2 contracts)
echo  Guard:   guard@test.com    / guard123
echo  Guard:   salam@test.com    / salam123  (assigned to WH-001→WH-004)
echo.
pause

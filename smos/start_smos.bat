@echo off
echo ========================================================
echo        STARTING SMART MICROFINANCE OS (SMOS)
echo ========================================================
echo.

echo [1] Starting Backend Server...
start "SMOS Backend" cmd /k "cd backend && npm install && npm run dev"

echo [2] Starting Frontend Server...
start "SMOS Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Servers are starting in new windows.
echo Please wait 10 seconds for the servers to initialize...
timeout /t 10

echo [3] Opening SMOS in your web browser...
start http://localhost:5173

echo.
echo If the site says "Refused to connect", check the two new black terminal windows for errors.
pause

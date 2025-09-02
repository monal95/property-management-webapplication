@echo off
echo ========================================
echo    LPRT Property Management System
echo ========================================
echo.
echo Starting both frontend and backend servers...
echo.

echo [1/3] Installing frontend dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo [2/3] Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies!
    pause
    exit /b 1
)

echo [3/3] Starting servers...
echo.
echo Starting backend server on port 5000...
start "Backend Server" cmd /k "npm run dev"

echo Starting frontend server on port 5173...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Servers are starting up!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
echo ========================================
pause >nul

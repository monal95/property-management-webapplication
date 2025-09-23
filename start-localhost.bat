@echo off
echo ========================================
echo     LPRT Localhost Development Setup
echo ========================================
echo.

echo [1/4] Checking dependencies...
if not exist "Backend\node_modules\" (
    echo Installing backend dependencies...
    cd Backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo [2/4] Starting MongoDB (if not running)...
echo Please ensure MongoDB is running on localhost:27017
echo Or update the .env file with your MongoDB Atlas URI

echo [3/4] Starting Backend Server...
echo Opening backend in new terminal window...
start "LPRT Backend" cmd /k "cd Backend && npm run dev"

echo [4/4] Starting Frontend Server...
echo Waiting 5 seconds for backend to start...
timeout /t 5 >nul

echo Opening frontend in new terminal window...
start "LPRT Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Development servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo Health:   http://localhost:5000/api/health
echo.
echo Press any key to close this window...
echo ========================================
pause >nul
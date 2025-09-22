@echo off
echo ========================================
echo       LPRT Deployment Setup
echo ========================================
echo.

echo [1/4] Checking project structure...
if not exist "frontend\" (
    echo ERROR: frontend directory not found!
    pause
    exit /b 1
)
if not exist "Backend\" (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)

echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)

echo [3/4] Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend!
    pause
    exit /b 1
)

echo [4/4] Installing backend dependencies...
cd ..\Backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo   Deployment Setup Complete! 
echo ========================================
echo.
echo Next Steps:
echo 1. Push code to GitHub repository
echo 2. Deploy Backend to Render
echo 3. Deploy Frontend to Vercel
echo 4. Update environment variables
echo.
echo See DEPLOYMENT_GUIDE.md for detailed instructions
echo ========================================
pause
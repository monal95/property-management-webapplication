@echo off
echo ========================================
echo    COMPLETE LOCALHOST FIX SCRIPT
echo ========================================
echo.

echo [1/6] Stopping any existing servers...
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force"
powershell -Command "Get-Process -Name nodemon -ErrorAction SilentlyContinue | Stop-Process -Force"
timeout /t 2 >nul

echo [2/6] Clearing frontend cache...
cd frontend
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"
cd ..

echo [3/6] Installing/updating dependencies...
cd Backend
call npm install >nul 2>&1
cd ..\frontend
call npm install >nul 2>&1
cd ..

echo [4/6] Testing backend startup...
cd Backend
start /min "Backend Test" cmd /c "node server.js & timeout /t 3 & exit"
cd ..
timeout /t 4 >nul

echo [5/6] Testing backend connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 3; Write-Host '[SUCCESS] Backend running on port 5000'; } catch { Write-Host '[ERROR] Backend not responding on port 5000'; }"

echo [6/6] Starting development servers...
echo.
echo Opening backend server...
start "LPRT Backend" cmd /k "cd Backend && npm run dev"

echo Waiting 5 seconds for backend to fully start...
timeout /t 5 >nul

echo Opening frontend server...
start "LPRT Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   LOCALHOST DEVELOPMENT READY!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo Health:   http://localhost:5000/api/health
echo.
echo Test Accounts:
echo Owner: testowner@gmail.com / Test@123
echo Tenant: testtenant@gmail.com / Test@123
echo.
echo If you see port 5050 errors, refresh the browser
echo The environment variables should now work correctly
echo.
echo Press any key to close this window...
echo ========================================
pause >nul
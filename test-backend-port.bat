@echo off
echo ========================================
echo     Testing Backend Connection
echo ========================================
echo.

echo Testing if backend is running on port 5000...
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; Write-Host 'SUCCESS: Backend is running on port 5000'; Write-Host 'Response:' $response.Content; } catch { Write-Host 'ERROR: Cannot connect to backend on port 5000'; Write-Host 'Please start the backend server first'; }"

echo.
echo Testing if anything is running on port 5050...
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5050/api/health' -TimeoutSec 2; Write-Host 'WARNING: Something is running on port 5050'; } catch { Write-Host 'Good: Nothing running on port 5050'; }"

echo.
echo ========================================
echo Press any key to close...
echo ========================================
pause >nul
@echo off
echo Starting Student Financial Planner...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm start"

timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   Student Financial Planner Started!
echo ========================================
echo.
echo Frontend: http://localhost:3003
echo Backend:  http://localhost:5001
echo.
echo Press any key to close this window...
pause > nul

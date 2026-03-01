@echo off
echo Setting up Student Financial Planner...
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Backend installation failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Frontend installation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo To start the application:
echo 1. Run start-backend.bat in one terminal
echo 2. Run start-frontend.bat in another terminal
echo.
echo Make sure MongoDB is running before starting the backend.
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
pause

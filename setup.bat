@echo off
echo ================================================================================
echo FLEET MANAGEMENT PLATFORM - QUICK SETUP
echo ================================================================================
echo.

echo [1/5] Applying database schema...
wrangler d1 execute fleet_os --file=database/schema.sql
if errorlevel 1 (
    echo ERROR: Failed to apply schema
    pause
    exit /b 1
)
echo ✓ Schema applied successfully
echo.

echo [2/5] Loading sample data...
wrangler d1 execute fleet_os --file=database/seed.sql
if errorlevel 1 (
    echo ERROR: Failed to load sample data
    pause
    exit /b 1
)
echo ✓ Sample data loaded
echo.

echo [3/5] Installing API dependencies...
cd api
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install API dependencies
    pause
    exit /b 1
)
cd ..
echo ✓ API dependencies installed
echo.

echo [4/5] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [5/5] Setting up environment...
if not exist .env.local (
    copy .env.example .env.local
    echo ✓ Created .env.local
) else (
    echo .env.local already exists
)
echo.

echo ================================================================================
echo SETUP COMPLETE!
echo ================================================================================
echo.
echo NEXT STEPS:
echo.
echo 1. Set JWT Secret:
echo    cd api
echo    wrangler secret put JWT_SECRET
echo    (Generate one with: openssl rand -base64 32)
echo.
echo 2. Start API (in terminal 1):
echo    cd api
echo    npm run dev
echo.
echo 3. Start Frontend (in terminal 2):
echo    npm run dev
echo.
echo 4. Open browser:
echo    http://localhost:5173
echo.
echo ================================================================================
pause

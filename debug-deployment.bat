@echo off
REM Debug script for BankWise Frontend deployment issues (Windows)
REM This script helps troubleshoot common deployment problems

echo 🔍 BankWise Frontend Deployment Debug Script
echo =============================================
echo.

REM Configuration
set PROJECT_ID=ai-productivity-suite-470813
set SERVICE_NAME=bankwise-frontend
set REGION=us-central1

echo 📋 Configuration:
echo Project ID: %PROJECT_ID%
echo Service Name: %SERVICE_NAME%
echo Region: %REGION%
echo.

REM Check if service exists
echo 🔍 Checking if service exists...
gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(metadata.name)" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Service exists
    
    REM Get service URL
    for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i
    echo 🌐 Service URL: %SERVICE_URL%
    
    REM Check service status
    echo.
    echo 📊 Service Status:
    gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="table(metadata.name,status.conditions[0].type,status.conditions[0].status,status.url)"
    
    REM Get recent logs
    echo.
    echo 📝 Recent Logs (last 50 lines):
    gcloud run services logs read %SERVICE_NAME% --region=%REGION% --limit=50
    
    REM Test health endpoint
    echo.
    echo 🏥 Testing health endpoint...
    curl -s "%SERVICE_URL%/health" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Health endpoint is responding
    ) else (
        echo ❌ Health endpoint is not responding
    )
    
    REM Test main page
    echo.
    echo 🌐 Testing main page...
    for /f "tokens=*" %%i in ('curl -s -o nul -w "%%{http_code}" "%SERVICE_URL%"') do set HTTP_STATUS=%%i
    echo HTTP Status: %HTTP_STATUS%
    
    if "%HTTP_STATUS%"=="200" (
        echo ✅ Main page is responding
    ) else (
        echo ❌ Main page is not responding correctly
        echo Response body:
        curl -s "%SERVICE_URL%" | more
    )
    
) else (
    echo ❌ Service does not exist
    echo.
    echo Available services in region %REGION%:
    gcloud run services list --region=%REGION%
)

echo.
echo 🔧 Troubleshooting Tips:
echo 1. If you see 404 errors, check the nginx configuration
echo 2. If you see blank pages, check browser console for JavaScript errors
echo 3. If health endpoint fails, the container might not be starting properly
echo 4. Check the logs above for any error messages
echo.
echo 📚 Useful commands:
echo View logs: gcloud run services logs tail %SERVICE_NAME% --region=%REGION%
echo Update service: gcloud run services update %SERVICE_NAME% --region=%REGION%
echo Delete service: gcloud run services delete %SERVICE_NAME% --region=%REGION%

pause

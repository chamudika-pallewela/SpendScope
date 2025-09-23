@echo off
REM BankWise Frontend Deployment Script for Google Cloud Run (Windows)
REM This script builds and deploys the React frontend to Google Cloud Run

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ID=ai-productivity-suite-470813
set SERVICE_NAME=bankwise-frontend
set REGION=us-central1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo 🚀 Starting deployment of BankWise Frontend to Google Cloud Run
echo Project ID: %PROJECT_ID%
echo Service Name: %SERVICE_NAME%
echo Region: %REGION%
echo.

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: gcloud CLI is not installed. Please install it first.
    echo Visit: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr /r "." >nul
if %errorlevel% neq 0 (
    echo ❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login'
    exit /b 1
)

REM Set the project
echo 📋 Setting project to %PROJECT_ID%...
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo 🔧 Enabling required APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

REM Build the Docker image
echo 🏗️  Building Docker image...
docker build -t %IMAGE_NAME% .

if %errorlevel% neq 0 (
    echo ❌ Error: Docker build failed
    exit /b 1
)

REM Push the image to Google Container Registry
echo 📤 Pushing image to Google Container Registry...
docker push %IMAGE_NAME%

if %errorlevel% neq 0 (
    echo ❌ Error: Docker push failed
    exit /b 1
)

REM Deploy to Cloud Run
echo 🚀 Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --region %REGION% ^
    --platform managed ^
    --allow-unauthenticated ^
    --port 8080 ^
    --memory 512Mi ^
    --cpu 1 ^
    --min-instances 0 ^
    --max-instances 10 ^
    --set-env-vars NODE_ENV=production

if %errorlevel% neq 0 (
    echo ❌ Error: Cloud Run deployment failed
    exit /b 1
)

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

echo.
echo ✅ Deployment completed successfully!
echo 🌐 Your app is available at: %SERVICE_URL%
echo.
echo 📊 To view logs, run:
echo gcloud run services logs tail %SERVICE_NAME% --region=%REGION%
echo.
echo 🔧 To update the service, run this script again.

pause

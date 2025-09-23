#!/bin/bash

# Debug script for BankWise Frontend deployment issues
# This script helps troubleshoot common deployment problems

echo "🔍 BankWise Frontend Deployment Debug Script"
echo "============================================="
echo ""

# Configuration
PROJECT_ID="ai-productivity-suite-470813"
SERVICE_NAME="bankwise-frontend"
REGION="us-central1"

echo "📋 Configuration:"
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if service exists
echo "🔍 Checking if service exists..."
if gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(metadata.name)" >/dev/null 2>&1; then
    echo "✅ Service exists"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo "🌐 Service URL: $SERVICE_URL"
    
    # Check service status
    echo ""
    echo "📊 Service Status:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(metadata.name,status.conditions[0].type,status.conditions[0].status,status.url)"
    
    # Get recent logs
    echo ""
    echo "📝 Recent Logs (last 50 lines):"
    gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50
    
    # Test health endpoint
    echo ""
    echo "🏥 Testing health endpoint..."
    if curl -s "$SERVICE_URL/health" >/dev/null; then
        echo "✅ Health endpoint is responding"
    else
        echo "❌ Health endpoint is not responding"
    fi
    
    # Test main page
    echo ""
    echo "🌐 Testing main page..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL")
    echo "HTTP Status: $HTTP_STATUS"
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Main page is responding"
    else
        echo "❌ Main page is not responding correctly"
        echo "Response body:"
        curl -s "$SERVICE_URL" | head -20
    fi
    
else
    echo "❌ Service does not exist"
    echo ""
    echo "Available services in region $REGION:"
    gcloud run services list --region=$REGION
fi

echo ""
echo "🔧 Troubleshooting Tips:"
echo "1. If you see 404 errors, check the nginx configuration"
echo "2. If you see blank pages, check browser console for JavaScript errors"
echo "3. If health endpoint fails, the container might not be starting properly"
echo "4. Check the logs above for any error messages"
echo ""
echo "📚 Useful commands:"
echo "View logs: gcloud run services logs tail $SERVICE_NAME --region=$REGION"
echo "Update service: gcloud run services update $SERVICE_NAME --region=$REGION"
echo "Delete service: gcloud run services delete $SERVICE_NAME --region=$REGION"

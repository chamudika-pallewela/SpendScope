# BankWise Frontend - Google Cloud Run Deployment Guide

This guide will help you deploy your BankWise React frontend application to Google Cloud Run.

## Prerequisites

Before deploying, ensure you have the following installed and configured:

1. **Google Cloud SDK (gcloud CLI)**
   - Download and install from: https://cloud.google.com/sdk/docs/install
   - Authenticate: `gcloud auth login`

2. **Docker**
   - Download and install from: https://www.docker.com/products/docker-desktop

3. **Node.js** (v18 or higher)
   - For local development and testing

## Quick Deployment

### Option 1: Using the Deployment Script (Recommended)

1. **Update the project ID** in the deployment script:

   ```bash
   # Edit deploy.sh (Linux/Mac) or deploy.bat (Windows)
   # Replace "your-project-id" with your actual Google Cloud project ID
   ```

2. **Run the deployment script**:

   ```bash
   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh

   # Windows
   deploy.bat
   ```

### Option 2: Manual Deployment

1. **Set your project ID**:

   ```bash
   export PROJECT_ID="your-project-id"
   gcloud config set project $PROJECT_ID
   ```

2. **Enable required APIs**:

   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Build and push the Docker image**:

   ```bash
   docker build -t gcr.io/$PROJECT_ID/bankwise-frontend .
   docker push gcr.io/$PROJECT_ID/bankwise-frontend
   ```

4. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy bankwise-frontend \
     --image gcr.io/$PROJECT_ID/bankwise-frontend \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --memory 512Mi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10
   ```

### Option 3: Using Cloud Build (CI/CD)

1. **Connect your repository** to Google Cloud Build
2. **Push your code** to trigger automatic deployment
3. The `cloudbuild.yaml` file will handle the build and deployment process

## Configuration

### Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `production` for production builds
- API endpoints are configured in `src/config/api.ts`

### Custom Domain (Optional)

To use a custom domain:

1. **Map your domain** in Cloud Run:

   ```bash
   gcloud run domain-mappings create \
     --service bankwise-frontend \
     --domain your-domain.com \
     --region us-central1
   ```

2. **Update DNS records** as instructed by the command output

## Monitoring and Logs

### View Logs

```bash
gcloud run services logs tail bankwise-frontend --region us-central1
```

### Monitor Performance

- Visit the [Cloud Run console](https://console.cloud.google.com/run)
- Check metrics, logs, and performance data

## Troubleshooting

### Common Issues

1. **Build fails**: Check Docker is running and you have sufficient disk space
2. **Push fails**: Ensure you're authenticated with `gcloud auth configure-docker`
3. **Deployment fails**: Check your project ID and permissions
4. **App not loading**: Verify the service URL and check logs

### Useful Commands

```bash
# List all services
gcloud run services list

# Get service details
gcloud run services describe bankwise-frontend --region us-central1

# Update service configuration
gcloud run services update bankwise-frontend --region us-central1 --memory 1Gi

# Delete service
gcloud run services delete bankwise-frontend --region us-central1
```

## Cost Optimization

- **Min instances**: Set to 0 to avoid charges when not in use
- **Max instances**: Adjust based on expected traffic
- **Memory/CPU**: Start with 512Mi/1 CPU, scale as needed
- **Region**: Choose the region closest to your users

## Security Considerations

- The service is configured with `--allow-unauthenticated` for public access
- For private access, remove this flag and configure IAM
- Consider adding authentication middleware if needed
- Regularly update dependencies and base images

## Updates and Maintenance

To update your deployment:

1. **Make your changes** to the code
2. **Run the deployment script again** or push to your connected repository
3. **Monitor the deployment** in the Cloud Run console

## Support

For issues with:

- **Google Cloud Run**: Check the [official documentation](https://cloud.google.com/run/docs)
- **Docker**: Refer to [Docker documentation](https://docs.docker.com/)
- **Application code**: Check the application logs and error messages

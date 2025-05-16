#!/bin/bash

# Handle interruption signals
trap 'echo "❌ Deployment cancelled by user"; exit 1' SIGINT SIGTERM

# WindBorne Air Quality Tracker Deployment Script for Vercel
# Usage: ./deploy.sh [--prod]
echo "🚀 Preparing to deploy WindBorne Air Quality Tracker"

# Check if npx is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found! Please ensure you have Node.js and npm installed."
    exit 1
fi

# Check if Vercel CLI is installed
if ! npx vercel --version &> /dev/null; then
    echo "❌ Vercel CLI not found! Installing now..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI. Please install it manually with 'npm install -g vercel'."
        exit 1
    fi
    echo "✅ Vercel CLI installed successfully."
fi

# Check if user is logged in to Vercel
npx vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ You are not logged in to Vercel. Please log in first."
    npx vercel login
    if [ $? -ne 0 ]; then
        echo "❌ Failed to log in to Vercel. Please try again manually with 'vercel login'."
        exit 1
    fi
    echo "✅ Successfully logged in to Vercel."
fi

# Check for environment variables
if [ -z "$VITE_OPENAQ_API_KEY" ]; then
    echo "⚠️  WARNING: VITE_OPENAQ_API_KEY environment variable not set!"
    echo "Air quality features may not work properly."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Build the project to verify it works
echo "🔨 Building project to verify everything works..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

# Prepare environment variables to pass to Vercel
ENV_VARS=""
if [ ! -z "$VITE_OPENAQ_API_KEY" ]; then
    ENV_VARS="$ENV_VARS --env VITE_OPENAQ_API_KEY=$VITE_OPENAQ_API_KEY"
fi

# Check if it's a production deployment
if [ "$1" == "--prod" ]; then
    echo "🌐 Deploying to production..."
    npx vercel --prod $ENV_VARS
    DEPLOY_STATUS=$?
else
    echo "🧪 Deploying to preview environment..."
    npx vercel $ENV_VARS
    DEPLOY_STATUS=$?
fi

# Handle deployment status
if [ $DEPLOY_STATUS -ne 0 ]; then
    echo "❌ Deployment failed with exit code $DEPLOY_STATUS!"
    echo "Please check the Vercel logs for more information."
    exit $DEPLOY_STATUS
else
    echo "✅ Deployment process completed successfully!"
    echo "🔗 Your application should be available at the URL provided above."
fi 
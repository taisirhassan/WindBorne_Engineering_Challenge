#!/bin/bash

# WindBorne Air Quality Tracker Deployment Script for Vercel
# Usage: ./deploy.sh [--prod]

echo "🚀 Preparing to deploy WindBorne Air Quality Tracker"

# Check if Vercel CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ NPX not found! Please ensure you have npm installed."
    exit 1
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

# Check if it's a production deployment
if [ "$1" == "--prod" ]; then
    echo "🌐 Deploying to production..."
    npx vercel --prod
else
    echo "🧪 Deploying to preview environment..."
    npx vercel
fi

echo "✅ Deployment process completed!" 
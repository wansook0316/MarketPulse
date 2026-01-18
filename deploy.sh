#!/bin/bash

# MarketPulse Deployment Script for Synology NAS
# This script handles the deployment process

set -e  # Exit on error

echo "🚀 Starting MarketPulse deployment..."

# Configuration
PROJECT_DIR="/volume1/Services/marketpulse"
BRANCH="${1:-main}"

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

echo "📦 Pulling latest code from $BRANCH..."
git fetch origin
git reset --hard origin/$BRANCH

echo "🔧 Checking environment variables..."
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual credentials!"
    exit 1
fi

echo "🛑 Stopping existing containers..."
docker-compose down

echo "📥 Pulling latest images..."
docker-compose pull

echo "🚀 Starting containers..."
docker-compose up -d

echo "🧹 Cleaning up old images..."
sudo docker image prune -f

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ Checking container status..."
docker-compose ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📝 View logs with: docker-compose logs -f"
echo "🔍 Check health: docker-compose ps"

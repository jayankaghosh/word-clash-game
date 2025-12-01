#!/bin/bash

# Word Clash Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Word Clash deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/var/www/html/word-clash-game"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"

# Step 1: Build Frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
cd frontend
npm install --production=false
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 2: Copy files to server (if not already there)
echo -e "${BLUE}📂 Preparing deployment directory...${NC}"
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR/build
sudo chown -R $USER:$USER $DEPLOY_DIR

# Step 3: Copy backend files
echo -e "${BLUE}📤 Copying backend files...${NC}"
cd ../backend
cp -r * $BACKEND_DIR/
cp .env.production $BACKEND_DIR/.env
cd $BACKEND_DIR
npm install --production
echo -e "${GREEN}✓ Backend files copied${NC}"

# Step 4: Copy frontend build
echo -e "${BLUE}📤 Copying frontend build...${NC}"
cd /Users/joy/Projects/playground/word-clash/frontend
cp -r build/* $FRONTEND_DIR/build/
echo -e "${GREEN}✓ Frontend files copied${NC}"

# Step 5: Setup nginx
echo -e "${BLUE}🔧 Setting up nginx...${NC}"
sudo cp /Users/joy/Projects/playground/word-clash/nginx.conf $DEPLOY_DIR/nginx.conf
echo -e "${GREEN}✓ Nginx config copied to $DEPLOY_DIR/nginx.conf${NC}"
echo -e "${BLUE}ℹ️  Make sure your main nginx server block includes this file${NC}"
sudo nginx -t
echo -e "${GREEN}✓ Nginx configuration validated${NC}"

# Step 6: Setup PM2 for backend
echo -e "${BLUE}🔄 Setting up PM2 for backend...${NC}"
cd $BACKEND_DIR
pm2 delete word-clash-backend || true
pm2 start server.js --name word-clash-backend
pm2 save
pm2 startup
echo -e "${GREEN}✓ Backend started with PM2${NC}"

# Step 7: Restart nginx
echo -e "${BLUE}🔄 Restarting nginx...${NC}"
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx restarted${NC}"

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}Your app is now running at: https://word-clash-game.jayanka.in${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 logs word-clash-backend  - View backend logs"
echo "  pm2 restart word-clash-backend  - Restart backend"
echo "  sudo nginx -t  - Test nginx config"
echo "  sudo systemctl restart nginx  - Restart nginx"

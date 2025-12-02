#!/bin/bash

# Word Clash Deployment Script
# Usage: ./deploy.sh
# 
# Prerequisites:
# - Code already pulled via git in current directory
# - PM2 installed globally
# - Nginx configured

set -e

echo "🚀 Starting Word Clash deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current directory
DEPLOY_DIR=$(pwd)

# Step 1: Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
npm install --production
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Step 2: Install and build frontend
echo -e "${BLUE}� Installing frontend dependencies...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo -e "${BLUE}🏗️  Building frontend...${NC}"
rm -r build
mv build_prod build
# npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 3: Restart backend with PM2
echo -e "${BLUE}� Restarting backend with PM2...${NC}"
cd ../backend
pm2 restart word-clash-backend || pm2 start server.js --name word-clash-backend
pm2 save
echo -e "${GREEN}✓ Backend restarted${NC}"

# Step 4: Test nginx configuration
echo -e "${BLUE}� Testing nginx configuration...${NC}"
sudo nginx -t
echo -e "${GREEN}✓ Nginx configuration OK${NC}"

# Step 5: Reload nginx
echo -e "${BLUE}🔄 Reloading nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}Your app is now running at: https://word-clash-game.jayanka.in${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 logs word-clash-backend       - View backend logs"
echo "  pm2 restart word-clash-backend    - Restart backend"
echo "  pm2 monit                         - Monitor PM2 processes"
echo "  sudo nginx -t                     - Test nginx config"
echo "  sudo systemctl reload nginx       - Reload nginx"

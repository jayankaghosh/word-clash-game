# Word Clash Deployment Guide

## Production Deployment with Nginx

This guide will help you deploy Word Clash to your production server.

### Prerequisites

1. Ubuntu/Debian server with root access
2. Domain: `word-clash-game.jayanka.in` pointing to your server
3. SSL certificate (Let's Encrypt recommended)

### Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Certbot for SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d word-clash-game.jayanka.in

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Update Nginx Config

After getting SSL certificate, update the nginx config:

```bash
# Edit the nginx.conf file and update SSL paths
# Certbot usually places certs at:
# /etc/letsencrypt/live/word-clash-game.jayanka.in/fullchain.pem
# /etc/letsencrypt/live/word-clash-game.jayanka.in/privkey.pem
```

Update in `nginx.conf`:
```nginx
ssl_certificate /etc/letsencrypt/live/word-clash-game.jayanka.in/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/word-clash-game.jayanka.in/privkey.pem;
```

### Deploy

1. **Upload your code to the server:**
   ```bash
   # From your local machine
   scp -r word-clash user@your-server-ip:/home/user/
   ```

2. **Run deployment script:**
   ```bash
   ssh user@your-server-ip
   cd /home/user/word-clash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Or deploy manually:**

   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   
   # Copy build to nginx directory
   sudo mkdir -p /var/www/word-clash/frontend
   sudo cp -r build/* /var/www/word-clash/frontend/build/
   ```

   **Backend:**
   ```bash
   cd backend
   cp .env.production .env
   npm install --production
   
   # Start with PM2
   pm2 start server.js --name word-clash-backend
   pm2 save
   pm2 startup
   ```

   **Nginx:**
   ```bash
   # Copy nginx config to project directory
   sudo cp nginx.conf /var/www/html/word-clash-game/nginx.conf
   
   # Create main server block if not exists
   sudo nano /etc/nginx/sites-available/word-clash
   # Add the following:
   ```
   
   ```nginx
   server {
       server_name word-clash-game.jayanka.in;
       set $PROJECT_ROOT /var/www/html/word-clash-game;
       include /var/www/html/word-clash-game/nginx.conf;
       client_max_body_size 100M;

       listen 443 ssl;
       ssl_certificate /etc/letsencrypt/live/word-clash-game.jayanka.in/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/word-clash-game.jayanka.in/privkey.pem;
       include /etc/letsencrypt/options-ssl-nginx.conf;
       ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
   }
   
   server {
       listen 80;
       server_name word-clash-game.jayanka.in;
       return 301 https://$server_name$request_uri;
   }
   ```
   
   ```bash
   # Enable site and restart
   sudo ln -s /etc/nginx/sites-available/word-clash /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Environment Variables

**Frontend** (`.env.production`):
```bash
REACT_APP_SOCKET_URL=https://word-clash-game.jayanka.in
```

**Backend** (`.env.production`):
```bash
PORT=3001
HOST=localhost
ALLOWED_ORIGINS=https://word-clash-game.jayanka.in
```

### Verify Deployment

1. **Check backend:**
   ```bash
   pm2 status
   pm2 logs word-clash-backend
   curl http://localhost:3001/api/config
   ```

2. **Check nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **Visit your site:**
   - https://word-clash-game.jayanka.in

### Common Commands

```bash
# Backend
pm2 restart word-clash-backend
pm2 logs word-clash-backend
pm2 stop word-clash-backend
pm2 delete word-clash-backend

# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t

# SSL Certificate Renewal
sudo certbot renew
```

### Troubleshooting

**Backend not starting:**
```bash
pm2 logs word-clash-backend
# Check if port 3001 is available
sudo lsof -i :3001
```

**Nginx errors:**
```bash
sudo tail -f /var/log/nginx/word-clash-error.log
sudo nginx -t
```

**WebSocket connection issues:**
- Make sure nginx is properly proxying WebSocket connections
- Check CORS settings in backend
- Verify SSL certificate is valid

**502 Bad Gateway:**
- Backend is not running
- Check PM2: `pm2 status`
- Check if backend is on correct port: `sudo lsof -i :3001`

### Updating the App

**Quick update:**
```bash
cd /path/to/word-clash

# Update frontend
cd frontend
git pull
npm install
npm run build
sudo cp -r build/* /var/www/word-clash/frontend/build/

# Update backend
cd ../backend
git pull
npm install --production
pm2 restart word-clash-backend
```

### Monitoring

```bash
# View logs
pm2 logs word-clash-backend

# Monitor resources
pm2 monit

# Check nginx access logs
sudo tail -f /var/log/nginx/word-clash-access.log
```

### Security Checklist

- ✅ SSL certificate installed and auto-renewal enabled
- ✅ Backend only accessible via localhost
- ✅ Firewall configured (allow 80, 443, SSH only)
- ✅ Security headers in nginx config
- ✅ CORS properly configured
- ✅ Environment variables not committed to git
- ✅ PM2 running as non-root user

### Backup

```bash
# Backup database/game state (if you add persistence)
# Backup nginx config
sudo cp /etc/nginx/sites-available/word-clash ~/backups/

# Backup SSL certificates
sudo cp -r /etc/letsencrypt ~/backups/
```

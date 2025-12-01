# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] Domain DNS pointing to server IP: `word-clash-game.jayanka.in`
- [ ] Server has Node.js v18+ installed
- [ ] Server has Nginx installed
- [ ] Server has PM2 installed globally
- [ ] SSL certificate obtained via Certbot

## Files to Upload

Upload these to server at `/var/www/html/word-clash-game/`:

```
/var/www/html/word-clash-game/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env (production config)
│   └── (other backend files)
├── frontend/
│   └── build/
│       └── (React build output)
└── nginx.conf (includable config)
```

## Step-by-Step Deployment

### 1. Build Frontend Locally
```bash
cd frontend
npm install
npm run build
```

### 2. Upload Files to Server
```bash
# Create directory
ssh user@server
sudo mkdir -p /var/www/html/word-clash-game
sudo chown -R $USER:$USER /var/www/html/word-clash-game

# Upload (from local machine)
scp -r backend user@server:/var/www/html/word-clash-game/
scp -r frontend/build user@server:/var/www/html/word-clash-game/frontend/
scp nginx.conf user@server:/var/www/html/word-clash-game/
```

### 3. Setup Backend
```bash
ssh user@server
cd /var/www/html/word-clash-game/backend
npm install --production

# Start with PM2
pm2 start server.js --name word-clash-backend
pm2 save
pm2 startup
```

### 4. Configure Nginx

**Copy the server block template:**
```bash
sudo cp /var/www/html/word-clash-game/nginx-server-block.conf /etc/nginx/sites-available/word-clash
```

**Or create manually:**
```bash
sudo nano /etc/nginx/sites-available/word-clash
```

Paste:
```nginx
server {
    listen 80;
    server_name word-clash-game.jayanka.in;
    return 301 https://$server_name$request_uri;
}

server {
    server_name word-clash-game.jayanka.in;
    set $PROJECT_ROOT /var/www/html/word-clash-game;
    include /var/www/html/word-clash-game/nginx.conf;
    client_max_body_size 100M;

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/word-clash-game.jayanka.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/word-clash-game.jayanka.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

### 5. Enable and Test
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/word-clash /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 6. Verify
- [ ] Backend running: `pm2 status`
- [ ] Backend logs: `pm2 logs word-clash-backend`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Visit: https://word-clash-game.jayanka.in
- [ ] Test WebSocket: Open browser console, should see Socket.io connection
- [ ] Test API: https://word-clash-game.jayanka.in/api/config

## Post-Deployment

### Monitoring
```bash
# Backend logs
pm2 logs word-clash-backend

# Nginx access logs
sudo tail -f /var/log/nginx/word-clash-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/word-clash-error.log
```

### Updates
```bash
# Update frontend
cd frontend
npm run build
scp -r build/* user@server:/var/www/html/word-clash-game/frontend/build/

# Update backend
scp -r backend/* user@server:/var/www/html/word-clash-game/backend/
ssh user@server
cd /var/www/html/word-clash-game/backend
npm install --production
pm2 restart word-clash-backend
```

## Troubleshooting

### Backend not starting
```bash
pm2 logs word-clash-backend
# Check port 3001
sudo lsof -i :3001
```

### 502 Bad Gateway
- Backend is down
- Check: `pm2 status`
- Restart: `pm2 restart word-clash-backend`

### WebSocket not connecting
- Check nginx WebSocket proxy config
- Check backend CORS settings
- Verify SSL certificate

### Static files 404
- Check frontend build path: `/var/www/html/word-clash-game/frontend/build`
- Check nginx root directive in included config

## Security
- [ ] SSL certificate valid and auto-renewing
- [ ] Firewall configured (80, 443, SSH only)
- [ ] Backend only on localhost
- [ ] Environment variables secured
- [ ] Regular system updates

## Success! 🎉
If all checks pass, your app is live at:
**https://word-clash-game.jayanka.in**

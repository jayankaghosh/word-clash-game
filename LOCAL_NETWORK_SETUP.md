# 🌐 Local Network Setup Guide

Play Word Clash with friends on the same WiFi network!

## Step 1: Find Your Local IP Address

**On Mac:**
```bash
ipconfig getifaddr en0
```
Or go to System Preferences → Network → Your active connection

**Example output:** `192.168.1.100`

## Step 2: Start the Backend on Your Computer

```bash
cd /Users/joy/Projects/playground/word-clash/backend
npm run dev
```

You'll see:
```
Server running on port 3001
Local: http://localhost:3001
Network: http://<your-local-ip>:3001
```

The backend is now accessible from any device on your network!

## Step 3A: Play on Your Computer (Host)

**Option 1: Use localhost (default)**
```bash
cd /Users/joy/Projects/playground/word-clash/frontend
npm start
```
Open http://localhost:3000

**Option 2: Use your local IP**
```bash
cd /Users/joy/Projects/playground/word-clash/frontend

# Create .env.local file
echo "REACT_APP_SOCKET_URL=http://192.168.1.100:3001" > .env.local
# Replace 192.168.1.100 with YOUR actual IP

npm start
```

## Step 3B: Play on Other Devices (Friends)

Your friend needs to access the React app on their device.

**Method 1: Use React's network access**
```bash
cd /Users/joy/Projects/playground/word-clash/frontend

# Create .env.local with your IP
echo "REACT_APP_SOCKET_URL=http://192.168.1.100:3001" > .env.local
echo "HOST=0.0.0.0" >> .env.local

npm start
```

React will show:
```
On Your Network:  http://192.168.1.100:3000
```

Your friend can open `http://192.168.1.100:3000` on their phone/computer!

**Method 2: Your friend runs their own frontend**
1. Clone/copy the project to their device
2. In their frontend folder, create `.env.local`:
   ```
   REACT_APP_SOCKET_URL=http://192.168.1.100:3001
   ```
   (Use YOUR IP address, not theirs)
3. Run `npm install` then `npm start`

## Quick Reference

| What | Where | URL |
|------|-------|-----|
| Backend Server | Your computer only | `http://YOUR_IP:3001` |
| Frontend (You) | Your computer | `http://localhost:3000` or `http://YOUR_IP:3000` |
| Frontend (Friend) | Their browser | `http://YOUR_IP:3000` |

## Example Complete Setup

**Your IP: 192.168.1.100**

1. **You run backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **You run frontend with network access:**
   ```bash
   cd frontend
   echo "REACT_APP_SOCKET_URL=http://192.168.1.100:3001" > .env.local
   echo "HOST=0.0.0.0" >> .env.local
   npm start
   ```

3. **Friend opens on their phone:**
   - Navigate to: `http://192.168.1.100:3000`
   - Play!

## Troubleshooting

**Friend can't connect?**
- ✅ Make sure you're on the same WiFi network
- ✅ Check firewall settings (allow ports 3000 and 3001)
- ✅ Verify your IP address is correct
- ✅ Make sure backend is running first

**React app not accessible from network?**
- Add `HOST=0.0.0.0` to `.env.local` in frontend folder
- Restart `npm start`

**macOS Firewall blocking?**
- System Preferences → Security & Privacy → Firewall
- Click "Firewall Options"
- Allow incoming connections for Node

---

**Ready to play!** 🎮 Share your IP and let friends join!

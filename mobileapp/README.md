# Word Clash Mobile App

React Native mobile app for Word Clash game, built with Expo SDK 54.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and set your backend server URL:

```bash
# For local development
SOCKET_URL=http://localhost:3001

# For local network testing
SOCKET_URL=http://192.168.1.100:3001

# For production
SOCKET_URL=https://your-server.com
```

**Important:** After changing `.env`, restart with cache clear:
```bash
npx expo start -c
```

## Running

### Development with Expo Go

1. Install Expo Go on your phone
2. Start the dev server:
   ```bash
   ulimit -n 10240  # macOS only - fix file watcher limit
   npx expo start
   ```
3. Scan the QR code with Expo Go

### Build for Production

```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## Features

- ✅ SDK 54 compatible with latest Expo Go
- ✅ Same UI as web version
- ✅ Haptic feedback
- ✅ Confetti animations
- ✅ Real-time multiplayer
- ✅ Environment variable support

## Troubleshooting

**SDK mismatch error:**
- Make sure your Expo Go app is up to date
- Clear cache: `npx expo start -c`

**Too many open files:**
```bash
ulimit -n 10240
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

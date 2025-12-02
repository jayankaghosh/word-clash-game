# Voice Chat Setup Guide

## Overview
Voice chat has been added to Word Clash, allowing players to talk to each other during games using WebRTC peer-to-peer audio.

## Features
- ✅ **Toggle on/off**: Microphone is disabled by default
- ✅ **Visual indicators**: See when opponent has their mic enabled
- ✅ **Connection status**: Green ring shows when voice is connected
- ✅ **Peer-to-peer**: Direct audio connection using WebRTC
- ✅ **NAT traversal**: Works across different networks using STUN servers

## How It Works

### Backend (Server)
- WebRTC signaling via Socket.IO
- Relays offers, answers, and ICE candidates between players
- Tracks voice enabled status for each player

### Frontend (Web)
- Uses browser's native WebRTC API
- `getUserMedia()` for microphone access
- Automatic audio playback of remote stream

### Mobile App
- Uses `react-native-webrtc` library
- Same WebRTC protocol as web
- Native media handling

## Installation

### Frontend
No additional dependencies needed - uses browser WebRTC.

### Mobile App
Install the dependency:
```bash
cd mobileapp
npm install react-native-webrtc
```

For iOS, you may need to add permissions to `Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for voice chat during games.</string>
```

For Android, add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

## Usage

### For Players

1. **Join or create a game** and wait in lobby
2. **Click the microphone button** (disabled by default, appears in lobby)
   - Grey = Mic off
   - Green = Mic on
   - Green with ring = Connected to opponent
3. **Grant microphone permission** when prompted by browser/app
4. **Talk freely** in the lobby and during the game
5. **Toggle off** when done

**Note**: The mic button is available in both the lobby screen and during gameplay.

### Visual Indicators

#### Web Frontend
- **Mic button** in top-right corner next to exit button
- **Opponent mic indicator** in top-left shows when opponent has mic enabled
- **Error messages** appear if voice chat fails

#### Mobile App
- **Mic button** positioned between scoreboard and exit button
- **Opponent indicator** shows in top-left corner
- **Visual feedback** with color changes

## Technical Details

### Connection Flow
1. Player A enables microphone
2. Player A gets local media stream
3. Player A creates peer connection
4. Player A sends offer to Player B via server
5. Player B (if mic enabled) receives offer
6. Player B creates answer
7. Player B sends answer to Player A via server
8. ICE candidates exchanged for NAT traversal
9. Direct peer-to-peer connection established
10. Audio streams in both directions

### STUN Servers Used
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

These are free public STUN servers provided by Google for WebRTC development.

## Troubleshooting

### No Audio
- Check microphone permissions in browser/app settings
- Ensure both players have enabled their microphones
- Check firewall/network settings (WebRTC needs UDP)

### Connection Fails
- Both players must enable voice before connection works
- Some corporate networks block WebRTC (TURN server may be needed)
- Check browser console for WebRTC errors

### Echo or Feedback
- Use headphones
- Lower volume
- Modern browsers have echo cancellation built-in

### Permission Denied
- Browser: Check site permissions in browser settings
- Mobile: Check app permissions in device settings
- Some browsers require HTTPS for microphone access

## Future Enhancements
- Add TURN server for networks that block peer-to-peer
- Volume controls
- Push-to-talk mode
- Mute opponent option
- Voice activity detection (visual indicator when speaking)

## Browser Compatibility
- ✅ Chrome/Edge (Chromium): Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS 11+)
- ✅ Opera: Full support
- ❌ IE11: Not supported

## Mobile Compatibility
- ✅ iOS: Requires iOS 11+
- ✅ Android: Requires Android 5.0+

# 🎮 Word Clash

A real-time multiplayer word game where players compete to find words starting and ending with specific letters.

**Available on:** 🌐 Web | 📱 iOS | 📱 Android

## 🎯 Game Rules

1. **Setup**: One player creates a game and shares the code with another player
2. **Round Start**: Players are randomly assigned "start" or "end" roles
3. **Letter Selection** (5 seconds): Each player types one letter
4. **Word Finding** (30 seconds): Both players race to find a valid English word that:
   - Starts with the "start" player's letter
   - Ends with the "end" player's letter
   - Hasn't been used in the game yet
5. **Scoring**: First player to submit a valid word wins the round
6. **Victory**: First player to reach the chosen number of wins (3, 5, 7, or 10) wins the game!

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation & Running

**1. Install Backend Dependencies**
```bash
cd backend
npm install
```

**2. Install Frontend Dependencies**
```bash
cd frontend
npm install
```

**3. Start Backend Server**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:3001

**4. Start Frontend (in a new terminal)**
```bash
cd frontend
npm start
```
App runs on http://localhost:3000

## 🌐 Play on Local Network (WiFi)

Want to play with friends on the same WiFi? See **[LOCAL_NETWORK_SETUP.md](LOCAL_NETWORK_SETUP.md)** for detailed instructions.

**Quick version:**
1. Find your local IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
2. Backend already works on network (no changes needed)
3. Create `frontend/.env.local`:
   ```
   REACT_APP_SOCKET_URL=http://YOUR_IP:3001
   HOST=0.0.0.0
   ```
4. Friend opens `http://YOUR_IP:3000` on their device!

## 🎨 Features

- ✅ Real-time multiplayer with Socket.io
- ✅ Unique game codes for easy joining
- ✅ Customizable game length (Best of 3/5/7/10)
- ✅ English dictionary validation (275,000+ words)
- ✅ Word reuse prevention
- ✅ Auto-restart on impossible letter combinations
- ✅ Sound effects with mute toggle
- ✅ Victory animations with confetti
- ✅ Beautiful gradient UI with TailwindCSS
- ✅ Responsive design for all devices

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express
- Socket.io
- an-array-of-english-words (dictionary)

**Frontend:**
- React 18
- Socket.io-client
- TailwindCSS
- Lucide React (icons)
- canvas-confetti (celebrations)
- Web Audio API (sound effects)

## 📁 Project Structure

```
word-clash/
├── backend/               # Node.js server
│   ├── server.js         # Main server with Socket.io
│   ├── package.json
│   └── README.md
├── frontend/             # React web app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── utils/        # SoundManager
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── README.md
├── mobileapp/            # React Native mobile app
│   ├── src/
│   │   ├── screens/      # Main screens
│   │   ├── components/   # Reusable components
│   │   └── utils/        # SoundManager
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── README.md
└── README.md
```

## 📱 Mobile App (React Native)

Play Word Clash on your phone!

```bash
cd mobileapp
npm install
```

**Configure backend URL in `App.js`:**
```javascript
const SOCKET_URL = 'http://192.168.1.100:3001'; // Your IP
```

**Run with Expo:**
```bash
npm start
```

Scan QR code with Expo Go app (iOS/Android) or run on simulator.

See **[mobileapp/README.md](mobileapp/README.md)** for detailed instructions.

## 🎮 How to Play

1. **Create a Game**
   - Enter your name
   - Click "Create New Game"
   - Choose how many rounds to win (3, 5, 7, or 10)
   - Share the game code with your friend

2. **Join a Game**
   - Enter your name
   - Click "Join Game"
   - Enter the 6-letter game code
   - Wait for the host to start

3. **Play Rounds**
   - Type your letter when assigned a role (5 seconds)
   - Find and submit a word matching the criteria (30 seconds)
   - First valid word wins the round!

4. **Win the Game**
   - Reach the target number of wins before your opponent
   - Celebrate with confetti! 🎉

## 🔊 Sound Effects

The game includes procedurally generated sound effects using Web Audio API:
- Letter submission beeps
- Countdown ticks
- Victory chimes
- Error buzzes
- Game end fanfares

Toggle sounds on/off with the speaker icon in the top-right corner.

## 🐛 Edge Cases Handled

- ❌ No valid words exist for letter combination → Auto-restart round
- ❌ Word already used → Rejected with error message
- ❌ Both players timeout → Move to next round
- ❌ Invalid word submission → Show error, allow retry
- ❌ Player disconnection → Notify opponent, end game

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Enjoy playing Word Clash!** 🎮✨

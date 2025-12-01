# 🚀 Quick Start Guide

## Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd /Users/joy/Projects/playground/word-clash/backend
npm run dev
```

You should see:
```
Server running on port 3001
Loaded 275000+ words into dictionary
```

✅ Keep this terminal running!

## Step 2: Start the Frontend (New Terminal)

Open a **NEW** terminal and run:

```bash
cd /Users/joy/Projects/playground/word-clash/frontend
npm start
```

The browser will automatically open at http://localhost:3000

✅ Keep this terminal running too!

## Step 3: Play the Game!

### To test with yourself (2 browser windows):

1. **Window 1**: 
   - Enter name (e.g., "Player 1")
   - Click "Create New Game"
   - Choose "Best of 3"
   - Copy the game code (e.g., "ABC123")

2. **Window 2** (Incognito/Private mode):
   - Open http://localhost:3000
   - Enter name (e.g., "Player 2")
   - Click "Join Game"
   - Enter the game code
   - Click "Join"

3. **Back to Window 1**:
   - Click "Start Game"
   - Have fun! 🎮

## 🎯 Game Flow

1. **Letter Selection** (5 seconds)
   - Type ONE letter when prompted
   
2. **Word Finding** (30 seconds)
   - Find a word starting with the first letter and ending with the second
   - Submit as fast as you can!

3. **First to X wins!**

## 🔊 Sound Toggle

- Click the speaker icon in the top-right to mute/unmute sounds

## 🐛 Troubleshooting

**Backend won't start?**
- Make sure port 3001 is not in use
- Run `npm install` in the backend folder

**Frontend won't start?**
- Make sure port 3000 is not in use
- Run `npm install` in the frontend folder

**Can't connect?**
- Make sure backend is running first
- Check that both are on localhost

---

**Enjoy Word Clash!** ⚔️

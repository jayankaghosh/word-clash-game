# MongoDB Setup Guide

This guide will help you set up MongoDB for logging game data in Word Clash.

## What Gets Logged

The backend automatically logs the following to MongoDB:

1. **Players** (`players` collection)
   - Player name, socket ID, IP address
   - Join timestamp

2. **Games** (`games` collection)
   - Game ID, game type (normal/battle-royale)
   - Players, game settings (rounds, timers)
   - Start/end timestamps, winner, final scores

3. **Rounds** (`rounds` collection)
   - Game ID, round number
   - Letter combination, all submissions
   - Winner, winning word, winning reason
   - Duration and timestamps

4. **Game Results** (`gameresults` collection)
   - Final game outcome summary
   - Winner, player scores, total rounds
   - Game duration

## Installation Options

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB:**
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB
   brew services start mongodb-community
   ```

2. **Verify it's running:**
   ```bash
   mongosh
   # Should connect to mongodb://127.0.0.1:27017
   ```

3. **Update .env:**
   ```
   MONGODB_URI=mongodb://localhost:27017/wordclash
   ```

### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Create account:** https://www.mongodb.com/cloud/atlas/register

2. **Create a free cluster:**
   - Choose M0 (Free tier)
   - Select your region
   - Create cluster

3. **Get connection string:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Update .env:**
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wordclash
   ```

### Option 3: Docker MongoDB

```bash
docker run -d -p 27017:27017 --name wordclash-mongo mongo:latest
```

## Install Dependencies

```bash
cd backend
npm install mongoose
```

## Viewing Data

### Using MongoDB Compass (GUI)
1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Browse `wordclash` database

### Using mongosh (CLI)
```bash
mongosh

use wordclash

# View players
db.players.find().pretty()

# View games
db.games.find().pretty()

# View rounds
db.rounds.find().pretty()

# View game results
db.gameresults.find().pretty()

# Example queries
# Recent games
db.games.find().sort({startedAt: -1}).limit(10)

# Games by type
db.games.find({gameType: "battle-royale"})

# Top winners
db.gameresults.aggregate([
  {$group: {_id: "$winner", wins: {$sum: 1}}},
  {$sort: {wins: -1}}
])
```

## Troubleshooting

**Connection Error:**
- Ensure MongoDB is running: `brew services list` (macOS)
- Check port 27017 is not blocked
- Verify MONGODB_URI in .env

**No Data Appearing:**
- Check backend console for MongoDB connection message
- Look for "Error logging" messages in console
- Verify database name matches in connection string

**Atlas Connection Issues:**
- Add your IP to Atlas whitelist (0.0.0.0/0 for all IPs)
- Ensure password doesn't have special characters in connection string
- URL encode password if it contains special characters

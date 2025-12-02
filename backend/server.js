require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB Models
const Player = require('./models/Player');
const Game = require('./models/Game');
const Round = require('./models/Round');
const GameResult = require('./models/GameResult');

// Load word-list (Oxford English Dictionary)
let words = [];
try {
  const wordList = require('word-list');
  const wordListPath = wordList.default || wordList;
  const wordListFile = fs.readFileSync(wordListPath, 'utf-8');
  words = wordListFile.split('\n').filter(w => w.trim().length >= 3 && w.trim().length <= 15).map(w => w.trim());
  console.log('Loaded Oxford English Dictionary from word-list package');
} catch (error) {
  console.error('Error loading word-list, falling back to an-array-of-english-words:', error.message);
  words = require('an-array-of-english-words').filter(w => w.length >= 3 && w.length <= 15);
}

const app = express();
const server = http.createServer(app);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wordclash';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Get allowed origins from env or use default
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '*';
const allowedOrigins = allowedOriginsEnv === '*' 
  ? '*' 
  : allowedOriginsEnv.split(',').map(o => o.trim());

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins, // Configurable via .env
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Serve sound files
app.use('/assets/sounds', express.static(path.join(__dirname, 'assets/sounds')));

// Serve how-to-play HTML
app.use('/public', express.static(path.join(__dirname, 'public')));

// Game configuration from environment
const gameConfig = {
  letterTimeOptions: (process.env.LETTER_TIME_OPTIONS || '3,5,7,10,15').split(',').map(Number),
  defaultLetterTime: parseInt(process.env.DEFAULT_LETTER_TIME) || 5,
  wordTimeOptions: (process.env.WORD_TIME_OPTIONS || '15,20,30,45,60,90,120').split(',').map(Number),
  defaultWordTime: parseInt(process.env.DEFAULT_WORD_TIME) || 30,
  roundsOptions: (process.env.ROUNDS_OPTIONS || '3,5,7,10').split(',').map(Number),
  defaultRounds: parseInt(process.env.DEFAULT_ROUNDS) || 5
};

// API endpoint to get game configuration
app.get('/api/config', (req, res) => {
  res.json(gameConfig);
});

// Create dictionary index by first and last letter
const wordSet = new Set(words.map(w => w.toLowerCase()));
const wordsByFirstLast = {};

// Index words by first and last letter for quick lookup
words.forEach(word => {
  const w = word.toLowerCase().trim();
  if (w.length < 3) return; // Minimum 3 letters
  
  const key = `${w[0]}-${w[w.length - 1]}`;
  if (!wordsByFirstLast[key]) {
    wordsByFirstLast[key] = [];
  }
  wordsByFirstLast[key].push(w);
});

console.log(`Loaded ${words.length} words into dictionary`);

// In-memory game storage
const games = new Map();
const playerSockets = new Map(); // socketId -> gameId

// Generate unique game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Check if word is valid
function isValidWord(word, startLetter, endLetter, usedWords) {
  const w = word.toLowerCase().trim();
  
  if (w.length < 3) return { valid: false, reason: 'Word must be at least 3 letters' };
  if (w.length > 15) return { valid: false, reason: 'Word too long (max 15 letters)' };
  if (!wordSet.has(w)) return { valid: false, reason: 'Not a valid English word' };
  if (usedWords.has(w)) return { valid: false, reason: 'Word already used' };
  if (w[0] !== startLetter.toLowerCase()) return { valid: false, reason: `Must start with '${startLetter}'` };
  if (w[w.length - 1] !== endLetter.toLowerCase()) return { valid: false, reason: `Must end with '${endLetter}'` };
  
  return { valid: true };
}

// Check if any valid words exist for combination
function hasValidWords(startLetter, endLetter, usedWords) {
  const key = `${startLetter.toLowerCase()}-${endLetter.toLowerCase()}`;
  const possibleWords = wordsByFirstLast[key] || [];
  
  // Check if there's at least one word not in usedWords
  return possibleWords.some(w => !usedWords.has(w));
}

// Get random letter
function getRandomLetter() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send game configuration to client on connect
  socket.emit('game-config', gameConfig);

  socket.on('create-game', ({ playerName, roundsToWin, letterTime, wordTime, gameType }) => {
    const gameId = generateGameCode();
    const game = {
      gameId: gameId,
      players: [{
        id: socket.id,
        name: playerName,
        score: 0,
        socketId: socket.id
      }],
      status: 'waiting',
      gameType: gameType || 'normal',
      roundsToWin: roundsToWin || 5,
      letterTime: letterTime || 5,
      wordTime: wordTime || 30,
      currentRound: 0,
      creator: socket.id,
      usedWords: new Set(),
      usedLetterCombinations: new Set(),
      // Battle Royale specific
      currentTurn: null, // socketId of player whose turn it is
      roundWords: [] // words submitted in current round
    };

    games.set(gameId, game);
    playerSockets.set(socket.id, gameId);
    socket.join(gameId);

    // Log player (creator) to MongoDB
    const playerLog = new Player({
      name: playerName,
      socketId: socket.id,
      ipAddress: socket.handshake.address
    });
    playerLog.save().catch(err => console.error('Error logging player:', err));

    socket.emit('game-created', { gameId, game });
    console.log(`Game ${gameId} created by ${playerName}`);
  });

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    game.players.push({
      id: socket.id,
      name: playerName,
      score: 0,
      socketId: socket.id
    });

    playerSockets.set(socket.id, gameId);
    socket.join(gameId);

    // Log player join to MongoDB
    const playerLog = new Player({
      name: playerName,
      socketId: socket.id,
      ipAddress: socket.handshake.address
    });
    playerLog.save().catch(err => console.error('Error logging player:', err));

    // Emit to the joining player first (guaranteed delivery)
    socket.emit('player-joined', { game });
    
    // Then broadcast to others in the room
    socket.to(gameId).emit('player-joined', { game });
    
    console.log(`${playerName} joined game ${gameId}`);
  });

  socket.on('start-game', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);

    if (!game || game.status !== 'waiting' || game.players.length !== 2) {
      socket.emit('error', { message: 'Cannot start game' });
      return;
    }

    game.status = 'playing';
    game.startTime = Date.now(); // Track game start time
    
    // Log game start to MongoDB
    const gameLog = new Game({
      gameId: gameId,
      gameType: game.gameType,
      players: game.players.map(p => ({ name: p.name, socketId: p.socketId })),
      roundsToWin: game.roundsToWin,
      letterTime: game.letterTime,
      wordTime: game.wordTime
    });
    gameLog.save().catch(err => console.error('Error logging game start:', err));
    
    io.to(gameId).emit('game-started', { game });
    
    // Start first round after a short delay
    setTimeout(() => startRound(gameId), 2000);
  });

  function startRound(gameId) {
    const game = games.get(gameId);
    if (!game || game.status !== 'playing') return;

    // Initialize round counter if not exists
    if (!game.currentRoundNumber) {
      game.currentRoundNumber = 0;
    }
    game.currentRoundNumber++;

    // Randomly assign roles
    const roles = Math.random() > 0.5 ? [0, 1] : [1, 0];
    
    game.currentRound = {
      startPlayer: game.players[roles[0]].id,
      endPlayer: game.players[roles[1]].id,
      startLetter: null,
      endLetter: null,
      submissions: [],
      phase: 'letter-input',
      hasEnded: false,
      roundNumber: game.currentRoundNumber,
      startTime: Date.now()
    };

    // Notify players of their roles
    io.to(game.players[roles[0]].socketId).emit('round-started', { role: 'start' });
    io.to(game.players[roles[1]].socketId).emit('round-started', { role: 'end' });

    // Auto-advance after letterTime seconds - store timeout
    // Add 500ms buffer to account for network latency and ensure client timer reaches 0
    game.currentRound.letterTimeout = setTimeout(() => {
      if (game.currentRound && game.currentRound.phase === 'letter-input') {
        // Auto-select random letter if no letter chosen
        if (!game.currentRound.startLetter) {
          game.currentRound.startLetter = getRandomLetter();
        }
        if (!game.currentRound.endLetter) {
          game.currentRound.endLetter = getRandomLetter();
        }
        revealLetters(gameId);
      }
    }, (game.letterTime * 1000) + 500);
  }

  socket.on('submit-letter', ({ letter }) => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);

    if (!game || !game.currentRound || game.currentRound.phase !== 'letter-input') return;

    const upperLetter = letter.toUpperCase();
    if (!/^[A-Z]$/.test(upperLetter)) return;

    if (socket.id === game.currentRound.startPlayer) {
      game.currentRound.startLetter = upperLetter;
    } else if (socket.id === game.currentRound.endPlayer) {
      game.currentRound.endLetter = upperLetter;
    }

    // If both letters submitted, advance immediately
    if (game.currentRound.startLetter && game.currentRound.endLetter) {
      revealLetters(gameId);
    }
  });

  function revealLetters(gameId) {
    const game = games.get(gameId);
    if (!game || !game.currentRound) return;

    // Clear the letter timeout if it exists
    if (game.currentRound.letterTimeout) {
      clearTimeout(game.currentRound.letterTimeout);
      game.currentRound.letterTimeout = null;
    }

    const { startLetter, endLetter } = game.currentRound;
    const letterCombo = `${startLetter}-${endLetter}`;
    
    // Battle Royale: Check if this combination was already used
    if (game.gameType === 'battle-royale' && game.usedLetterCombinations.has(letterCombo)) {
      io.to(gameId).emit('combination-used', { startLetter, endLetter });
      
      // Clear current round data and restart letter selection
      game.currentRound.startLetter = null;
      game.currentRound.endLetter = null;
      game.currentRound.phase = 'letter-input';
      
      // Restart letter selection after 2 seconds
      setTimeout(() => {
        // Notify players to select letters again
        const roles = [game.currentRound.startPlayer, game.currentRound.endPlayer];
        const player1 = game.players.find(p => p.id === roles[0]);
        const player2 = game.players.find(p => p.id === roles[1]);
        
        if (player1 && player2) {
          io.to(player1.socketId).emit('round-started', { role: 'start' });
          io.to(player2.socketId).emit('round-started', { role: 'end' });
        }
        
        // Set new letter selection timeout
        game.currentRound.letterTimeout = setTimeout(() => {
          if (game.currentRound && game.currentRound.phase === 'letter-input') {
            // Auto-select random letter if no letter chosen
            if (!game.currentRound.startLetter) {
              game.currentRound.startLetter = getRandomLetter();
            }
            if (!game.currentRound.endLetter) {
              game.currentRound.endLetter = getRandomLetter();
            }
            revealLetters(gameId);
          }
        }, (game.letterTime * 1000) + 500);
      }, 2000);
      return;
    }
    
    // Check if valid words exist
    if (!hasValidWords(startLetter, endLetter, game.usedWords)) {
      io.to(gameId).emit('no-valid-words', { startLetter, endLetter });
      
      // Clear current round data and restart letter selection immediately
      game.currentRound.startLetter = null;
      game.currentRound.endLetter = null;
      game.currentRound.phase = 'letter-input';
      
      // Restart round after 2 seconds to show the message
      setTimeout(() => {
        // Notify players to select letters again
        const roles = [game.currentRound.startPlayer, game.currentRound.endPlayer];
        const player1 = game.players.find(p => p.id === roles[0]);
        const player2 = game.players.find(p => p.id === roles[1]);
        
        if (player1 && player2) {
          io.to(player1.socketId).emit('round-started', { role: 'start' });
          io.to(player2.socketId).emit('round-started', { role: 'end' });
        }
        
        // Set new letter selection timeout
        game.currentRound.letterTimeout = setTimeout(() => {
          if (game.currentRound && game.currentRound.phase === 'letter-input') {
            // Auto-select random letter if no letter chosen
            if (!game.currentRound.startLetter) {
              game.currentRound.startLetter = getRandomLetter();
            }
            if (!game.currentRound.endLetter) {
              game.currentRound.endLetter = getRandomLetter();
            }
            revealLetters(gameId);
          }
        }, (game.letterTime * 1000) + 500);
      }, 2000);
      return;
    }

    // Mark combination as used in battle royale
    if (game.gameType === 'battle-royale') {
      game.usedLetterCombinations.add(letterCombo);
      game.roundWords = []; // Reset words for this round
      game.currentTurn = game.currentRound.startPlayer; // Creator goes first
    }

    game.currentRound.phase = 'word-input';
    io.to(gameId).emit('letters-revealed', { startLetter, endLetter });

    // Battle Royale: Notify whose turn it is
    if (game.gameType === 'battle-royale') {
      const currentPlayer = game.players.find(p => p.id === game.currentTurn);
      io.to(gameId).emit('turn-update', { 
        currentTurn: currentPlayer?.name,
        roundWords: game.roundWords 
      });
    }

    // Auto-advance after wordTime seconds - store timeout
    // Add 2000ms for letter reveal delay (frontend) + 500ms buffer for network latency
    // Mobile uses 1500ms but this covers both
    game.currentRound.wordTimeout = setTimeout(() => {
      if (game.currentRound && game.currentRound.phase === 'word-input') {
        // Battle Royale: Award point to opponent if current player times out
        if (game.gameType === 'battle-royale') {
          const timedOutPlayer = game.players.find(p => p.id === game.currentTurn);
          const winningPlayer = game.players.find(p => p.id !== game.currentTurn);
          
          game.currentRound.winner = winningPlayer.id;
          game.currentRound.loser = game.currentTurn;
          game.currentRound.winningReason = `${timedOutPlayer?.name} ran out of time`;
          
          if (winningPlayer) winningPlayer.score++;
        }
        
        endRound(gameId);
      }
    }, (game.wordTime * 1000) + 2500);
  }

  socket.on('skip-round', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);

    if (!game || !game.currentRound || game.currentRound.phase !== 'word-input') return;

    if (game.gameType === 'battle-royale') {
      // Battle Royale: If current player skips, opponent wins
      if (socket.id !== game.currentTurn) {
        socket.emit('error', { message: 'Not your turn!' });
        return;
      }

      const skippingPlayer = game.players.find(p => p.id === socket.id);
      const winningPlayer = game.players.find(p => p.id !== socket.id);
      
      game.currentRound.winner = winningPlayer.id;
      game.currentRound.loser = socket.id;
      game.currentRound.winningReason = `${skippingPlayer?.name} skipped their turn`;
      
      if (winningPlayer) winningPlayer.score++;
      
      endRound(gameId);
    } else {
      // Normal Mode: Track who skipped
      if (!game.currentRound.skips) {
        game.currentRound.skips = [];
      }
      
      // Prevent double skip from same player
      if (game.currentRound.skips.includes(socket.id)) {
        return;
      }
      
      game.currentRound.skips.push(socket.id);
      
      // If both players skipped, it's a draw
      if (game.currentRound.skips.length === 2) {
        game.currentRound.winner = null;
        game.currentRound.winningReason = 'Both players skipped';
        endRound(gameId);
      }
    }
  });

  socket.on('submit-word', ({ word }) => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);

    if (!game || !game.currentRound || game.currentRound.phase !== 'word-input') return;

    const { startLetter, endLetter } = game.currentRound;
    
    // Normal Mode: First valid word wins
    if (game.gameType === 'normal') {
      const validation = isValidWord(word, startLetter, endLetter, game.usedWords);

      if (!validation.valid) {
        socket.emit('invalid-word', { reason: validation.reason });
        return;
      }

      // Valid word - this player wins the round
      game.usedWords.add(word.toLowerCase());
      game.currentRound.winner = socket.id;
      game.currentRound.winningWord = word;

      // Update score
      const player = game.players.find(p => p.id === socket.id);
      if (player) player.score++;

      // End the round immediately
      endRound(gameId);
      return;
    }

    // Battle Royale Mode: Turn-based word submission
    if (game.gameType === 'battle-royale') {
      // Check if it's this player's turn
      if (socket.id !== game.currentTurn) {
        socket.emit('error', { message: 'Not your turn!' });
        return;
      }

      const validation = isValidWord(word, startLetter, endLetter, game.usedWords);

      if (!validation.valid) {
        // Let player retry with different word
        socket.emit('invalid-word', { reason: validation.reason });
        return;
      }

      // Valid word - add to round words and switch turn
      const w = word.toLowerCase();
      game.usedWords.add(w);
      game.roundWords.push({ player: game.players.find(p => p.id === socket.id)?.name, word: w });

      // Reset timer for next player
      if (game.currentRound.wordTimeout) {
        clearTimeout(game.currentRound.wordTimeout);
      }

      // Switch turn to other player
      const otherPlayer = game.players.find(p => p.id !== socket.id);
      game.currentTurn = otherPlayer.id;

      // Broadcast word submitted and turn update
      io.to(gameId).emit('word-accepted', { 
        word: w, 
        player: game.players.find(p => p.id === socket.id)?.name,
        roundWords: game.roundWords 
      });

      const currentPlayer = game.players.find(p => p.id === game.currentTurn);
      io.to(gameId).emit('turn-update', { 
        currentTurn: currentPlayer?.name,
        roundWords: game.roundWords 
      });

      // Start timer for next player
      // Add 500ms buffer to account for network latency (no letter reveal delay for turn changes)
      game.currentRound.wordTimeout = setTimeout(() => {
        if (game.currentRound && game.currentRound.phase === 'word-input') {
          // Current player ran out of time - other player wins
          const timedOutPlayer = game.players.find(p => p.id === game.currentTurn);
          const winningPlayer = game.players.find(p => p.id !== game.currentTurn);
          
          game.currentRound.winner = winningPlayer.id;
          game.currentRound.loser = game.currentTurn;
          game.currentRound.winningReason = `${timedOutPlayer?.name} ran out of time`;
          
          if (winningPlayer) winningPlayer.score++;
          
          endRound(gameId);
        }
      }, (game.wordTime * 1000) + 500);
    }
  });

  function endRound(gameId) {
    const game = games.get(gameId);
    if (!game || !game.currentRound) return;

    const round = game.currentRound;
    
    // Prevent double execution
    if (round.hasEnded) return;
    round.hasEnded = true;

    // Clear the word timeout if it exists
    if (round.wordTimeout) {
      clearTimeout(round.wordTimeout);
      round.wordTimeout = null;
    }

    // Set phase to ended
    game.currentRound.phase = 'ended';
    round.endTime = Date.now();

    const winner = game.players.find(p => p.id === round.winner);
    
    // Log round to MongoDB
    const roundLog = new Round({
      gameId: gameId,
      gameType: game.gameType,
      roundNumber: round.roundNumber || game.currentRoundNumber || 1,
      startLetter: round.startLetter,
      endLetter: round.endLetter,
      players: round.submissions.map(sub => ({
        name: sub.playerName,
        word: sub.word,
        submittedAt: sub.timestamp || new Date(),
        skipped: sub.skipped || false
      })),
      winner: winner?.name || null,
      winningWord: round.winningWord || null,
      winningReason: round.winningReason || null,
      roundWords: game.roundWords || [],
      startedAt: new Date(round.startTime),
      endedAt: new Date(round.endTime),
      duration: round.endTime - round.startTime
    });
    roundLog.save().catch(err => console.error('Error logging round:', err));
    
    // Battle Royale: Include all words and winning reason
    if (game.gameType === 'battle-royale') {
      io.to(gameId).emit('round-ended', {
        winner: winner ? winner.name : null,
        word: round.winningWord || null,
        winningReason: round.winningReason || `${winner?.name} outlasted opponent`,
        roundWords: game.roundWords,
        scores: game.players.map(p => ({ name: p.name, score: p.score }))
      });
    } else {
      // Normal mode
      io.to(gameId).emit('round-ended', {
        winner: winner ? winner.name : null,
        word: round.winningWord || null,
        scores: game.players.map(p => ({ name: p.name, score: p.score }))
      });
    }

    // Check if game is over
    const gameWinner = game.players.find(p => p.score >= game.roundsToWin);
    if (gameWinner) {
      game.status = 'finished';
      game.endTime = Date.now();
      
      // Log game result to MongoDB
      const gameResult = new GameResult({
        gameId: gameId,
        gameType: game.gameType,
        winner: gameWinner.name,
        players: game.players.map(p => ({
          name: p.name,
          finalScore: p.score
        })),
        totalRounds: game.currentRoundNumber || 1,
        duration: game.endTime - game.startTime
      });
      gameResult.save().catch(err => console.error('Error logging game result:', err));
      
      setTimeout(() => {
        io.to(gameId).emit('game-ended', { winner: gameWinner.name, scores: game.players.map(p => ({ name: p.name, score: p.score })) });
      }, 3000);
    }
    // Creator will manually start the next round
  }

  socket.on('start-next-round', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (!game) return;
    
    // Only creator can start next round
    if (socket.id !== game.creator) return;
    
    startRound(gameId);
  });

  socket.on('leave-lobby', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (!game) return;
    
    const player = game.players.find(p => p.id === socket.id);
    const playerName = player ? player.name : 'A player';
    
    // Notify other players in lobby
    io.to(gameId).emit('player-left-lobby', { 
      message: `${playerName} has left the lobby.` 
    });
    
    // Disconnect all sockets from the room
    game.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.id);
      if (playerSocket) {
        playerSocket.leave(gameId);
      }
      playerSockets.delete(p.id);
    });
    
    // Clean up the game
    games.delete(gameId);
    
    console.log(`Player ${playerName} left lobby ${gameId}, all sockets disconnected`);
  });

  socket.on('exit-game', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (!game) return;
    
    const player = game.players.find(p => p.id === socket.id);
    const playerName = player ? player.name : 'A player';
    
    // Notify all players in the game
    io.to(gameId).emit('game-exited', { 
      message: `${playerName} has exited the game.` 
    });
    
    // Disconnect all sockets from the room
    game.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.id);
      if (playerSocket) {
        playerSocket.leave(gameId);
      }
      playerSockets.delete(p.id);
    });
    
    // Clean up the game
    games.delete(gameId);
    
    console.log(`Game ${gameId} ended by ${playerName}, all sockets disconnected`);
  });

  // WebRTC signaling for voice chat
  socket.on('voice-offer', ({ targetSocketId, offer }) => {
    console.log('Relaying voice offer from', socket.id, 'to', targetSocketId);
    io.to(targetSocketId).emit('voice-offer', {
      fromSocketId: socket.id,
      offer
    });
  });

  socket.on('voice-answer', ({ targetSocketId, answer }) => {
    console.log('Relaying voice answer from', socket.id, 'to', targetSocketId);
    io.to(targetSocketId).emit('voice-answer', {
      fromSocketId: socket.id,
      answer
    });
  });

  socket.on('voice-ice-candidate', ({ targetSocketId, candidate }) => {
    console.log('Relaying ICE candidate from', socket.id, 'to', targetSocketId);
    io.to(targetSocketId).emit('voice-ice-candidate', {
      fromSocketId: socket.id,
      candidate
    });
  });

  socket.on('voice-enabled', ({ enabled }) => {
    const gameId = playerSockets.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        // Update player's voice status
        const player = game.players.find(p => p.id === socket.id);
        if (player) {
          player.voiceEnabled = enabled;
          // Notify all players in the game
          io.to(gameId).emit('player-voice-status', {
            socketId: socket.id,
            enabled,
            players: game.players.map(p => ({
              id: p.id,
              name: p.name,
              voiceEnabled: p.voiceEnabled || false
            }))
          });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const gameId = playerSockets.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        // Notify other players
        io.to(gameId).emit('player-disconnected', { message: 'Opponent disconnected' });
        
        // Disconnect all sockets from the room
        game.players.forEach(p => {
          const playerSocket = io.sockets.sockets.get(p.id);
          if (playerSocket) {
            playerSocket.leave(gameId);
          }
          playerSockets.delete(p.id);
        });
        
        // Clean up the game
        games.delete(gameId);
      } else {
        playerSockets.delete(socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://<your-local-ip>:${PORT}`);
  if (allowedOrigins === '*') {
    console.log(`CORS: ✅ Allowing all origins (development mode)`);
  } else {
    console.log(`CORS: Allowing origins: ${Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : allowedOrigins}`);
  }
});

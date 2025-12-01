require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
    io.to(gameId).emit('game-started', { game });
    
    // Start first round after a short delay
    setTimeout(() => startRound(gameId), 2000);
  });

  function startRound(gameId) {
    const game = games.get(gameId);
    if (!game || game.status !== 'playing') return;

    // Randomly assign roles
    const roles = Math.random() > 0.5 ? [0, 1] : [1, 0];
    
    game.currentRound = {
      startPlayer: game.players[roles[0]].id,
      endPlayer: game.players[roles[1]].id,
      startLetter: null,
      endLetter: null,
      submissions: [],
      phase: 'letter-input',
      hasEnded: false
    };

    // Notify players of their roles
    io.to(game.players[roles[0]].socketId).emit('round-started', { role: 'start' });
    io.to(game.players[roles[1]].socketId).emit('round-started', { role: 'end' });

    // Auto-advance after letterTime seconds - store timeout
    game.currentRound.letterTimeout = setTimeout(() => {
      if (game.currentRound && game.currentRound.phase === 'letter-input') {
        // Assign random letters if not submitted
        if (!game.currentRound.startLetter) {
          game.currentRound.startLetter = getRandomLetter();
        }
        if (!game.currentRound.endLetter) {
          game.currentRound.endLetter = getRandomLetter();
        }
        revealLetters(gameId);
      }
    }, game.letterTime * 1000);
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
      // Restart letter selection
      setTimeout(() => startRound(gameId), 2000);
      return;
    }
    
    // Check if valid words exist
    if (!hasValidWords(startLetter, endLetter, game.usedWords)) {
      io.to(gameId).emit('no-valid-words', { startLetter, endLetter });
      
      // Restart round after 2 seconds
      setTimeout(() => startRound(gameId), 2000);
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
    game.currentRound.wordTimeout = setTimeout(() => {
      if (game.currentRound && game.currentRound.phase === 'word-input') {
        endRound(gameId);
      }
    }, game.wordTime * 1000);
  }

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
      }, game.wordTime * 1000);
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

    const winner = game.players.find(p => p.id === round.winner);
    
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

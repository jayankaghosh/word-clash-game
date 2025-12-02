const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  gameType: {
    type: String,
    enum: ['normal', 'battle-royale'],
    required: true
  },
  players: [{
    name: String,
    socketId: String
  }],
  roundsToWin: {
    type: Number,
    required: true
  },
  letterTime: {
    type: Number,
    required: true
  },
  wordTime: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  winner: String,
  finalScores: [{
    playerName: String,
    score: Number
  }],
  status: {
    type: String,
    enum: ['started', 'completed', 'abandoned'],
    default: 'started'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);

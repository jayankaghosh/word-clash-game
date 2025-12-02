const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    enum: ['normal', 'battle-royale'],
    required: true
  },
  winner: {
    type: String,
    required: true
  },
  players: [{
    name: String,
    finalScore: Number
  }],
  totalRounds: {
    type: Number,
    required: true
  },
  duration: Number, // in milliseconds
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameResult', gameResultSchema);

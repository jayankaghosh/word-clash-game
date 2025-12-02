const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    enum: ['normal', 'battle-royale'],
    required: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  startLetter: {
    type: String,
    required: true
  },
  endLetter: {
    type: String,
    required: true
  },
  players: [{
    name: String,
    word: String,
    submittedAt: Date,
    skipped: Boolean
  }],
  winner: String,
  winningWord: String,
  winningReason: String,
  roundWords: [String], // For battle royale mode
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: Number // in milliseconds
}, {
  timestamps: true
});

module.exports = mongoose.model('Round', roundSchema);

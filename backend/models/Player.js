const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);

const mongoose = require('mongoose');

const RoomCommunitySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },
  conferenceId: {
    type: String,
    required: true
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create composite index for uniqueness
RoomCommunitySchema.index({ roomId: 1, conferenceId: 1 }, { unique: true });

module.exports = mongoose.model('RoomCommunity', RoomCommunitySchema); 
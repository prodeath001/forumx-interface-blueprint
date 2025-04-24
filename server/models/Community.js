const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberCount: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
CommunitySchema.index({ name: 1 });
CommunitySchema.index({ tags: 1 });
CommunitySchema.index({ memberCount: -1 });

// Define mock data for development if needed
if (process.env.NODE_ENV === 'development' && !global.mockCommunities) {
  global.mockCommunities = new Map();
}

module.exports = mongoose.model('Community', CommunitySchema); 
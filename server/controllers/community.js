const Community = require('../models/Community');
const User = require('../models/User');

// Helper function to check if we're using mock DB
const usingMockDB = () => {
  return global.mockCommunities !== undefined;
};

// Mock DB helper functions
const generateMockId = () => `community_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, topics, icon, banner, isPrivate } = req.body;
    
    if (usingMockDB()) {
      // Check if community with this name already exists
      const existingCommunity = Array.from(global.mockCommunities.values()).find(
        c => c.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingCommunity) {
        return res.status(400).json({ error: 'A community with this name already exists' });
      }
      
      // Create community ID
      const communityId = generateMockId();
      
      // Get user info
      const userId = req.user._id;
      
      // Create new community
      const newCommunity = {
        _id: communityId,
        name,
        description,
        topics: topics || [],
        icon: icon || '',
        banner: banner || '',
        isPrivate: isPrivate || false,
        creator: userId,
        moderators: [userId],
        members: [userId],
        rules: [],
        createdAt: new Date(),
        memberCount: 1,
        formattedMemberCount: '1'
      };
      
      // Save to mock DB
      global.mockCommunities.set(communityId, newCommunity);
      
      return res.status(201).json(newCommunity);
    } else {
      // Using real MongoDB
      // Check if community already exists
      const communityExists = await Community.findOne({ name: new RegExp(`^${name}$`, 'i') });
      
      if (communityExists) {
        return res.status(400).json({ error: 'A community with this name already exists' });
      }
      
      // Create new community
      const community = await Community.create({
        name,
        description,
        topics: topics || [],
        icon: icon || '',
        banner: banner || '',
        isPrivate: isPrivate || false,
        creator: req.user._id,
        moderators: [req.user._id],
        members: [req.user._id]
      });
      
      res.status(201).json(community);
    }
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
exports.getCommunities = async (req, res) => {
  try {
    if (usingMockDB()) {
      // Get all communities from mock DB
      const communities = Array.from(global.mockCommunities.values());
      
      // Sort by member count (most popular first)
      communities.sort((a, b) => b.memberCount - a.memberCount);
      
      return res.json(communities);
    } else {
      // Using real MongoDB
      const communities = await Community.find()
        .sort({ memberCount: -1 }) // Most popular first
        .populate('creator', 'username avatar');
      
      res.json(communities);
    }
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get community by ID
// @route   GET /api/communities/:id
// @access  Public
exports.getCommunityById = async (req, res) => {
  try {
    const communityId = req.params.id;
    
    if (usingMockDB()) {
      // Get community from mock DB
      const community = global.mockCommunities.get(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      return res.json(community);
    } else {
      // Using real MongoDB
      const community = await Community.findById(communityId)
        .populate('creator', 'username avatar')
        .populate('moderators', 'username avatar');
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      res.json(community);
    }
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinCommunity = async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;
    
    if (usingMockDB()) {
      // Get community from mock DB
      const community = global.mockCommunities.get(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      // Check if user is already a member
      if (community.members.includes(userId)) {
        return res.status(400).json({ error: 'You are already a member of this community' });
      }
      
      // Add user to members
      community.members.push(userId);
      community.memberCount = community.members.length;
      
      // Update formatted member count
      if (community.memberCount >= 1000000) {
        community.formattedMemberCount = (community.memberCount / 1000000).toFixed(1) + 'M';
      } else if (community.memberCount >= 1000) {
        community.formattedMemberCount = (community.memberCount / 1000).toFixed(1) + 'K';
      } else {
        community.formattedMemberCount = community.memberCount.toString();
      }
      
      // Save to mock DB
      global.mockCommunities.set(communityId, community);
      
      return res.json(community);
    } else {
      // Using real MongoDB
      const community = await Community.findById(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      // Check if user is already a member
      if (community.members.includes(userId)) {
        return res.status(400).json({ error: 'You are already a member of this community' });
      }
      
      // Add user to members
      community.members.push(userId);
      
      await community.save();
      
      res.json(community);
    }
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;
    
    if (usingMockDB()) {
      // Get community from mock DB
      const community = global.mockCommunities.get(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      // Check if user is a member
      if (!community.members.includes(userId)) {
        return res.status(400).json({ error: 'You are not a member of this community' });
      }
      
      // Check if user is the creator
      if (community.creator === userId) {
        return res.status(400).json({ error: 'Community creator cannot leave. Transfer ownership first.' });
      }
      
      // Remove user from members
      community.members = community.members.filter(id => id !== userId);
      community.memberCount = community.members.length;
      
      // Remove from moderators if they are one
      community.moderators = community.moderators.filter(id => id !== userId);
      
      // Update formatted member count
      if (community.memberCount >= 1000000) {
        community.formattedMemberCount = (community.memberCount / 1000000).toFixed(1) + 'M';
      } else if (community.memberCount >= 1000) {
        community.formattedMemberCount = (community.memberCount / 1000).toFixed(1) + 'K';
      } else {
        community.formattedMemberCount = community.memberCount.toString();
      }
      
      // Save to mock DB
      global.mockCommunities.set(communityId, community);
      
      return res.json(community);
    } else {
      // Using real MongoDB
      const community = await Community.findById(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      // Check if user is a member
      if (!community.members.includes(userId)) {
        return res.status(400).json({ error: 'You are not a member of this community' });
      }
      
      // Check if user is the creator
      if (community.creator.toString() === userId.toString()) {
        return res.status(400).json({ error: 'Community creator cannot leave. Transfer ownership first.' });
      }
      
      // Remove user from members
      community.members = community.members.filter(id => id.toString() !== userId.toString());
      
      // Remove from moderators if they are one
      community.moderators = community.moderators.filter(id => id.toString() !== userId.toString());
      
      await community.save();
      
      res.json(community);
    }
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update community
// @route   PUT /api/communities/:id
// @access  Private (creator or moderator only)
exports.updateCommunity = async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;
    const { description, icon, banner, topics, rules, isPrivate } = req.body;
    
    if (usingMockDB()) {
      // Get community from mock DB
      const community = global.mockCommunities.get(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      // Check if user is creator or moderator
      if (community.creator !== userId && !community.moderators.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized to update this community' });
      }
      
      // Update fields (except name which should be immutable)
      if (description) community.description = description;
      if (icon) community.icon = icon;
      if (banner) community.banner = banner;
      if (topics) community.topics = topics;
      if (rules) community.rules = rules;
      if (typeof isPrivate === 'boolean') community.isPrivate = isPrivate;
      
      // Save to mock DB
      global.mockCommunities.set(communityId, community);
      
      return res.json(community);
    } else {
      // Using real MongoDB
      const community = await Community.findById(communityId);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      // Check if user is creator or moderator
      if (community.creator.toString() !== userId.toString() && 
          !community.moderators.some(id => id.toString() === userId.toString())) {
        return res.status(403).json({ error: 'Not authorized to update this community' });
      }
      
      // Update fields (except name which should be immutable)
      if (description) community.description = description;
      if (icon) community.icon = icon;
      if (banner) community.banner = banner;
      if (topics) community.topics = topics;
      if (rules) community.rules = rules;
      if (typeof isPrivate === 'boolean') community.isPrivate = isPrivate;
      
      await community.save();
      
      res.json(community);
    }
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 
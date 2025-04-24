const Community = require('../models/Community');
const User = require('../models/User');

// Check if we're using mockdb or MongoDB
const isMockDb = !process.env.MONGODB_URI || process.env.USE_MOCK_DB === 'true';

// Create a new community
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, tags, isPrivate, image } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    // Check if a community with the same name already exists
    let existingCommunity;
    
    if (isMockDb) {
      existingCommunity = Array.from(global.mockCommunities.values())
        .find(community => community.name.toLowerCase() === name.toLowerCase());
    } else {
      existingCommunity = await Community.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    }

    if (existingCommunity) {
      return res.status(400).json({ message: 'A community with this name already exists' });
    }

    // Create new community
    const communityData = {
      name,
      description,
      creator: req.user.id,
      moderators: [req.user.id],
      members: [req.user.id],
      tags: tags || [],
      isPrivate: isPrivate || false,
      image: image || 'https://via.placeholder.com/150',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let newCommunity;
    
    if (isMockDb) {
      // For mock database
      const id = Date.now().toString();
      newCommunity = { ...communityData, _id: id, id };
      global.mockCommunities.set(id, newCommunity);
    } else {
      // For MongoDB
      newCommunity = await Community.create(communityData);
    }

    res.status(201).json({
      success: true,
      data: newCommunity
    });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all communities (with optional filters)
exports.getCommunities = async (req, res) => {
  try {
    const { search, tags, sort = 'newest', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Add search filter if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Add tags filter if provided
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    let sortOption = {};
    
    // Sort options
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { memberCount: -1 };
        break;
      case 'alphabetical':
        sortOption = { name: 1 };
        break;
      default: // newest
        sortOption = { createdAt: -1 };
    }
    
    let communities;
    let total;
    
    if (isMockDb) {
      // For mock database
      let allCommunities = Array.from(global.mockCommunities.values());
      
      // Apply filters
      if (search) {
        allCommunities = allCommunities.filter(community => 
          community.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        allCommunities = allCommunities.filter(community => 
          community.tags.some(tag => tagArray.includes(tag))
        );
      }
      
      // Apply sort
      if (sort === 'oldest') {
        allCommunities.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sort === 'popular') {
        allCommunities.sort((a, b) => b.memberCount - a.memberCount);
      } else if (sort === 'alphabetical') {
        allCommunities.sort((a, b) => a.name.localeCompare(b.name));
      } else { // newest
        allCommunities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      total = allCommunities.length;
      communities = allCommunities.slice(skip, skip + parseInt(limit));
    } else {
      // For MongoDB
      communities = await Community.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('creator', 'username avatar')
        .lean();
      
      total = await Community.countDocuments(query);
    }
    
    // Pagination data
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      count: communities.length,
      pagination: {
        total,
        page: parseInt(page),
        pages,
        limit: parseInt(limit)
      },
      data: communities
    });
  } catch (error) {
    console.error('Error getting communities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get a single community by ID
exports.getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let community;
    
    if (isMockDb) {
      // For mock database
      community = global.mockCommunities.get(id);
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
    } else {
      // For MongoDB
      community = await Community.findById(id)
        .populate('creator', 'username avatar')
        .populate('moderators', 'username avatar')
        .lean();
        
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Error getting community:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Join a community
exports.joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    let community;
    
    if (isMockDb) {
      // For mock database
      community = global.mockCommunities.get(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if user is already a member
      if (community.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this community'
        });
      }
      
      // Add user to members array
      community.members.push(userId);
      community.memberCount = community.members.length;
      community.updatedAt = new Date();
      
      global.mockCommunities.set(id, community);
    } else {
      // For MongoDB
      community = await Community.findById(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if user is already a member
      if (community.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this community'
        });
      }
      
      // Add user to members array
      community.members.push(userId);
      community.memberCount = community.members.length;
      await community.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Successfully joined community',
      data: community
    });
  } catch (error) {
    console.error('Error joining community:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Leave a community
exports.leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    let community;
    
    if (isMockDb) {
      // For mock database
      community = global.mockCommunities.get(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if user is a member
      if (!community.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are not a member of this community'
        });
      }
      
      // Check if user is the creator
      if (community.creator === userId) {
        return res.status(400).json({
          success: false,
          message: 'Community creator cannot leave the community'
        });
      }
      
      // Remove user from members array
      community.members = community.members.filter(member => member !== userId);
      
      // Remove user from moderators array if they are a moderator
      if (community.moderators.includes(userId)) {
        community.moderators = community.moderators.filter(mod => mod !== userId);
      }
      
      community.memberCount = community.members.length;
      community.updatedAt = new Date();
      
      global.mockCommunities.set(id, community);
    } else {
      // For MongoDB
      community = await Community.findById(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if user is a member
      if (!community.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are not a member of this community'
        });
      }
      
      // Check if user is the creator
      if (community.creator.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Community creator cannot leave the community'
        });
      }
      
      // Remove user from members and moderators arrays
      community.members = community.members.filter(member => member.toString() !== userId);
      community.moderators = community.moderators.filter(mod => mod.toString() !== userId);
      community.memberCount = community.members.length;
      
      await community.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Successfully left community',
      data: community
    });
  } catch (error) {
    console.error('Error leaving community:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update a community
exports.updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, tags, isPrivate, image } = req.body;
    
    let community;
    
    if (isMockDb) {
      // For mock database
      community = global.mockCommunities.get(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if user is the creator or a moderator
      if (community.creator !== userId && !community.moderators.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this community'
        });
      }
      
      // Update community fields
      if (name) community.name = name;
      if (description) community.description = description;
      if (tags) community.tags = tags;
      if (isPrivate !== undefined) community.isPrivate = isPrivate;
      if (image) community.image = image;
      community.updatedAt = new Date();
      
      global.mockCommunities.set(id, community);
    } else {
      // For MongoDB
      community = await Community.findById(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if user is the creator or a moderator
      if (community.creator.toString() !== userId && 
          !community.moderators.some(mod => mod.toString() === userId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this community'
        });
      }
      
      // If name is being updated, check for duplicates
      if (name && name !== community.name) {
        const existingCommunity = await Community.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: id }
        });
        
        if (existingCommunity) {
          return res.status(400).json({
            success: false,
            message: 'A community with this name already exists'
          });
        }
      }
      
      // Update community fields
      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (tags) updateData.tags = tags;
      if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
      if (image) updateData.image = image;
      
      community = await Community.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Community updated successfully',
      data: community
    });
  } catch (error) {
    console.error('Error updating community:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add moderator to a community
exports.addModerator = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    let community;
    
    if (isMockDb) {
      // For mock database
      community = global.mockCommunities.get(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if current user is the creator
      if (community.creator !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the community creator can add moderators'
        });
      }
      
      // Check if user is a member
      if (!community.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'The user must be a member of the community to become a moderator'
        });
      }
      
      // Check if user is already a moderator
      if (community.moderators.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a moderator'
        });
      }
      
      // Add user to moderators array
      community.moderators.push(userId);
      community.updatedAt = new Date();
      
      global.mockCommunities.set(id, community);
    } else {
      // For MongoDB
      community = await Community.findById(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if current user is the creator
      if (community.creator.toString() !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the community creator can add moderators'
        });
      }
      
      // Check if user is a member
      if (!community.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'The user must be a member of the community to become a moderator'
        });
      }
      
      // Check if user is already a moderator
      if (community.moderators.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a moderator'
        });
      }
      
      // Add user to moderators array
      community.moderators.push(userId);
      await community.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Moderator added successfully',
      data: community
    });
  } catch (error) {
    console.error('Error adding moderator:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community or user not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Remove moderator from a community
exports.removeModerator = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;
    
    let community;
    
    if (isMockDb) {
      // For mock database
      community = global.mockCommunities.get(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if current user is the creator
      if (community.creator !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the community creator can remove moderators'
        });
      }
      
      // Check if user is a moderator
      if (!community.moderators.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is not a moderator'
        });
      }
      
      // Remove user from moderators array
      community.moderators = community.moderators.filter(mod => mod !== userId);
      community.updatedAt = new Date();
      
      global.mockCommunities.set(id, community);
    } else {
      // For MongoDB
      community = await Community.findById(id);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }
      
      // Check if current user is the creator
      if (community.creator.toString() !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the community creator can remove moderators'
        });
      }
      
      // Check if user is a moderator
      if (!community.moderators.some(mod => mod.toString() === userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is not a moderator'
        });
      }
      
      // Remove user from moderators array
      community.moderators = community.moderators.filter(mod => mod.toString() !== userId);
      await community.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Moderator removed successfully',
      data: community
    });
  } catch (error) {
    console.error('Error removing moderator:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community or user not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 
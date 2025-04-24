const RoomCommunity = require('../models/RoomCommunity');
const Community = require('../models/Community');
const { v4: uuidv4 } = require('uuid');

// Check if we're using mockdb or MongoDB
const isMockDb = !process.env.MONGODB_URI || process.env.USE_MOCK_DB === 'true';

// Create a community from a conference room
exports.createCommunityFromRoom = async (req, res) => {
  try {
    const { conferenceId, roomId } = req.params;
    const { name, description, tags, isPrivate, image } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    // Check if a community already exists for this room
    let existingRoomCommunity;
    
    if (isMockDb) {
      // Mock DB implementation
      if (!global.mockRoomCommunities) {
        global.mockRoomCommunities = new Map();
      }
      
      existingRoomCommunity = Array.from(global.mockRoomCommunities.values())
        .find(rc => rc.conferenceId === conferenceId && rc.roomId === roomId);
    } else {
      // MongoDB implementation
      existingRoomCommunity = await RoomCommunity.findOne({
        conferenceId,
        roomId
      });
    }

    if (existingRoomCommunity) {
      return res.status(400).json({ message: 'A community already exists for this room' });
    }

    // Check if the conference and room exist
    // For simplicity, we'll assume they exist if we can find them in memory
    // In a full implementation, you'd validate against the stored conferences
    const conference = global.conferences?.get(conferenceId);
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }
    
    const room = conference.rooms?.get(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create the community
    let newCommunity;
    
    if (isMockDb) {
      // Mock DB implementation
      if (!global.mockCommunities) {
        global.mockCommunities = new Map();
      }
      
      const communityId = uuidv4();
      newCommunity = {
        _id: communityId,
        id: communityId,
        name,
        description,
        creator: req.user.id,
        moderators: [req.user.id],
        members: [req.user.id],
        tags: tags || [],
        isPrivate: isPrivate || false,
        image: image || 'https://via.placeholder.com/150',
        memberCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      global.mockCommunities.set(communityId, newCommunity);
      
      // Create the room-community relationship
      const rcId = uuidv4();
      const roomCommunity = {
        _id: rcId,
        id: rcId,
        roomId,
        conferenceId,
        communityId,
        creator: req.user.id,
        createdAt: new Date()
      };
      
      global.mockRoomCommunities.set(rcId, roomCommunity);
    } else {
      // MongoDB implementation
      newCommunity = await Community.create({
        name,
        description,
        creator: req.user.id,
        moderators: [req.user.id],
        members: [req.user.id],
        tags: tags || [],
        isPrivate: isPrivate || false,
        image: image || room.image || 'https://via.placeholder.com/150'
      });
      
      // Create the room-community relationship
      await RoomCommunity.create({
        roomId,
        conferenceId,
        communityId: newCommunity._id,
        creator: req.user.id
      });
    }
    
    // Notify room participants about the new community
    const io = req.app.get('io');
    if (io) {
      io.to(`${conferenceId}:${roomId}`).emit('community-created', {
        communityId: newCommunity._id || newCommunity.id,
        name: newCommunity.name,
        description: newCommunity.description
      });
    }

    res.status(201).json({
      success: true,
      message: 'Community created successfully from room',
      data: newCommunity
    });
  } catch (error) {
    console.error('Error creating community from room:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get the community associated with a room
exports.getRoomCommunity = async (req, res) => {
  try {
    const { conferenceId, roomId } = req.params;
    
    let roomCommunity;
    let community;
    
    if (isMockDb) {
      // Mock DB implementation
      if (!global.mockRoomCommunities) {
        global.mockRoomCommunities = new Map();
      }
      
      roomCommunity = Array.from(global.mockRoomCommunities.values())
        .find(rc => rc.conferenceId === conferenceId && rc.roomId === roomId);
      
      if (roomCommunity && global.mockCommunities) {
        community = global.mockCommunities.get(roomCommunity.communityId);
      }
    } else {
      // MongoDB implementation
      roomCommunity = await RoomCommunity.findOne({
        conferenceId,
        roomId
      });
      
      if (roomCommunity) {
        community = await Community.findById(roomCommunity.communityId)
          .populate('creator', 'username avatar')
          .populate('moderators', 'username avatar');
      }
    }
    
    if (!roomCommunity || !community) {
      return res.status(404).json({
        success: false,
        message: 'No community found for this room'
      });
    }
    
    res.status(200).json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Error getting room community:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if a room has an associated community
exports.checkRoomCommunity = async (req, res) => {
  try {
    const { conferenceId, roomId } = req.params;
    
    let roomCommunity;
    
    if (isMockDb) {
      // Mock DB implementation
      if (!global.mockRoomCommunities) {
        global.mockRoomCommunities = new Map();
      }
      
      roomCommunity = Array.from(global.mockRoomCommunities.values())
        .find(rc => rc.conferenceId === conferenceId && rc.roomId === roomId);
    } else {
      // MongoDB implementation
      roomCommunity = await RoomCommunity.findOne({
        conferenceId,
        roomId
      });
    }
    
    res.status(200).json({
      success: true,
      hasCommunity: !!roomCommunity,
      communityId: roomCommunity ? roomCommunity.communityId : null
    });
  } catch (error) {
    console.error('Error checking room community:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roomCommunityController = require('../controllers/roomCommunityController');

// Check if a room has an associated community
router.get('/conferences/:conferenceId/rooms/:roomId/community/check', roomCommunityController.checkRoomCommunity);

// Get community for a room
router.get('/conferences/:conferenceId/rooms/:roomId/community', roomCommunityController.getRoomCommunity);

// Protected routes
router.use(protect);

// Create a community from a room
router.post('/conferences/:conferenceId/rooms/:roomId/community', roomCommunityController.createCommunityFromRoom);

module.exports = router; 
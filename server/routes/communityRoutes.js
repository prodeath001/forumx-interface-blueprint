const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const communityController = require('../controllers/communityController');

// GET all communities with optional filtering/sorting/pagination
router.get('/', communityController.getCommunities);

// GET a single community by ID
router.get('/:id', communityController.getCommunityById);

// Protected routes
router.use(authMiddleware);

// POST create a new community
router.post('/', communityController.createCommunity);

// POST join a community
router.post('/:id/join', communityController.joinCommunity);

// DELETE leave a community
router.delete('/:id/leave', communityController.leaveCommunity);

// PUT update a community
router.put('/:id', communityController.updateCommunity);

// POST add a moderator to a community
router.post('/:id/moderators', communityController.addModerator);

// DELETE remove a moderator from a community
router.delete('/:id/moderators/:userId', communityController.removeModerator);

module.exports = router; 
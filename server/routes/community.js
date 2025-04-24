const express = require('express');
const router = express.Router();
const { 
  createCommunity, 
  getCommunities, 
  getCommunityById, 
  joinCommunity, 
  leaveCommunity, 
  updateCommunity 
} = require('../controllers/community');
const { protect } = require('../middleware/auth');

// GET all communities
router.get('/', getCommunities);

// GET community by ID
router.get('/:id', getCommunityById);

// POST create new community
router.post('/', protect, createCommunity);

// POST join community
router.post('/:id/join', protect, joinCommunity);

// POST leave community
router.post('/:id/leave', protect, leaveCommunity);

// PUT update community
router.put('/:id', protect, updateCommunity);

module.exports = router; 
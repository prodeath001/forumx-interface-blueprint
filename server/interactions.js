const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory data stores (in a production app, these would be database models)
const interactions = {
  upvotes: new Map(),
  downvotes: new Map(),
  comments: new Map(),
  shares: new Map(),
  saves: new Map()
};

// Shared utility functions
const getInteractionKey = (userId, itemId) => `${userId}:${itemId}`;
const getInteractionsForItem = (type, itemId) => {
  const result = [];
  interactions[type].forEach((value, key) => {
    if (value.itemId === itemId) {
      result.push(value);
    }
  });
  return result;
};

// UPVOTE ENDPOINTS

// Add upvote
router.post('/upvote', (req, res) => {
  try {
    const { userId, itemId, itemType } = req.body;
    
    if (!userId || !itemId || !itemType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    
    // Check if already upvoted
    if (interactions.upvotes.has(key)) {
      return res.status(200).json({ message: 'Already upvoted', upvote: interactions.upvotes.get(key) });
    }
    
    // Remove any downvote by this user on this item
    if (interactions.downvotes.has(key)) {
      interactions.downvotes.delete(key);
    }
    
    // Add upvote
    const upvote = {
      id: uuidv4(),
      userId,
      itemId,
      itemType,
      timestamp: new Date()
    };
    
    interactions.upvotes.set(key, upvote);
    
    res.status(201).json({ message: 'Upvote added successfully', upvote });
  } catch (error) {
    console.error('Error adding upvote:', error);
    res.status(500).json({ error: 'Failed to add upvote' });
  }
});

// Remove upvote
router.delete('/upvote', (req, res) => {
  try {
    const { userId, itemId } = req.body;
    
    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    
    // Check if upvote exists
    if (!interactions.upvotes.has(key)) {
      return res.status(404).json({ error: 'Upvote not found' });
    }
    
    // Remove upvote
    interactions.upvotes.delete(key);
    
    res.status(200).json({ message: 'Upvote removed successfully' });
  } catch (error) {
    console.error('Error removing upvote:', error);
    res.status(500).json({ error: 'Failed to remove upvote' });
  }
});

// Get upvotes for an item
router.get('/upvotes/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Missing item ID' });
    }
    
    const itemUpvotes = getInteractionsForItem('upvotes', itemId);
    
    res.status(200).json({
      itemId,
      count: itemUpvotes.length,
      upvotes: itemUpvotes
    });
  } catch (error) {
    console.error('Error retrieving upvotes:', error);
    res.status(500).json({ error: 'Failed to retrieve upvotes' });
  }
});

// DOWNVOTE ENDPOINTS

// Add downvote
router.post('/downvote', (req, res) => {
  try {
    const { userId, itemId, itemType } = req.body;
    
    if (!userId || !itemId || !itemType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    
    // Check if already downvoted
    if (interactions.downvotes.has(key)) {
      return res.status(200).json({ message: 'Already downvoted', downvote: interactions.downvotes.get(key) });
    }
    
    // Remove any upvote by this user on this item
    if (interactions.upvotes.has(key)) {
      interactions.upvotes.delete(key);
    }
    
    // Add downvote
    const downvote = {
      id: uuidv4(),
      userId,
      itemId,
      itemType,
      timestamp: new Date()
    };
    
    interactions.downvotes.set(key, downvote);
    
    res.status(201).json({ message: 'Downvote added successfully', downvote });
  } catch (error) {
    console.error('Error adding downvote:', error);
    res.status(500).json({ error: 'Failed to add downvote' });
  }
});

// Remove downvote
router.delete('/downvote', (req, res) => {
  try {
    const { userId, itemId } = req.body;
    
    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    
    // Check if downvote exists
    if (!interactions.downvotes.has(key)) {
      return res.status(404).json({ error: 'Downvote not found' });
    }
    
    // Remove downvote
    interactions.downvotes.delete(key);
    
    res.status(200).json({ message: 'Downvote removed successfully' });
  } catch (error) {
    console.error('Error removing downvote:', error);
    res.status(500).json({ error: 'Failed to remove downvote' });
  }
});

// Get downvotes for an item
router.get('/downvotes/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Missing item ID' });
    }
    
    const itemDownvotes = getInteractionsForItem('downvotes', itemId);
    
    res.status(200).json({
      itemId,
      count: itemDownvotes.length,
      downvotes: itemDownvotes
    });
  } catch (error) {
    console.error('Error retrieving downvotes:', error);
    res.status(500).json({ error: 'Failed to retrieve downvotes' });
  }
});

// COMMENT ENDPOINTS

// Add comment
router.post('/comment', (req, res) => {
  try {
    const { userId, itemId, itemType, content, userName, userAvatar } = req.body;
    
    if (!userId || !itemId || !itemType || !content) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Add comment
    const comment = {
      id: uuidv4(),
      userId,
      itemId,
      itemType,
      content,
      userName: userName || 'Anonymous',
      userAvatar,
      timestamp: new Date(),
      replies: []
    };
    
    interactions.comments.set(comment.id, comment);
    
    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update comment
router.put('/comment/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!commentId || !content) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Check if comment exists
    if (!interactions.comments.has(commentId)) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Update comment
    const comment = interactions.comments.get(commentId);
    comment.content = content;
    comment.editedAt = new Date();
    
    interactions.comments.set(commentId, comment);
    
    res.status(200).json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/comment/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    
    if (!commentId) {
      return res.status(400).json({ error: 'Missing comment ID' });
    }
    
    // Check if comment exists
    if (!interactions.comments.has(commentId)) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Remove comment
    interactions.comments.delete(commentId);
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Get comments for an item
router.get('/comments/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Missing item ID' });
    }
    
    const itemComments = getInteractionsForItem('comments', itemId);
    
    // Sort comments by timestamp (newest first)
    itemComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.status(200).json({
      itemId,
      count: itemComments.length,
      comments: itemComments
    });
  } catch (error) {
    console.error('Error retrieving comments:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// SHARE ENDPOINTS

// Add share
router.post('/share', (req, res) => {
  try {
    const { userId, itemId, itemType, platform } = req.body;
    
    if (!userId || !itemId || !itemType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Add share
    const share = {
      id: uuidv4(),
      userId,
      itemId,
      itemType,
      platform: platform || 'generic',
      timestamp: new Date()
    };
    
    interactions.shares.set(share.id, share);
    
    res.status(201).json({ message: 'Share recorded successfully', share });
  } catch (error) {
    console.error('Error recording share:', error);
    res.status(500).json({ error: 'Failed to record share' });
  }
});

// Get shares for an item
router.get('/shares/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Missing item ID' });
    }
    
    const itemShares = getInteractionsForItem('shares', itemId);
    
    res.status(200).json({
      itemId,
      count: itemShares.length,
      shares: itemShares
    });
  } catch (error) {
    console.error('Error retrieving shares:', error);
    res.status(500).json({ error: 'Failed to retrieve shares' });
  }
});

// SAVE ENDPOINTS

// Add save
router.post('/save', (req, res) => {
  try {
    const { userId, itemId, itemType } = req.body;
    
    if (!userId || !itemId || !itemType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    
    // Check if already saved
    if (interactions.saves.has(key)) {
      return res.status(200).json({ message: 'Already saved', save: interactions.saves.get(key) });
    }
    
    // Add save
    const save = {
      id: uuidv4(),
      userId,
      itemId,
      itemType,
      timestamp: new Date()
    };
    
    interactions.saves.set(key, save);
    
    res.status(201).json({ message: 'Item saved successfully', save });
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

// Remove save
router.delete('/save', (req, res) => {
  try {
    const { userId, itemId } = req.body;
    
    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    
    // Check if save exists
    if (!interactions.saves.has(key)) {
      return res.status(404).json({ error: 'Save not found' });
    }
    
    // Remove save
    interactions.saves.delete(key);
    
    res.status(200).json({ message: 'Save removed successfully' });
  } catch (error) {
    console.error('Error removing save:', error);
    res.status(500).json({ error: 'Failed to remove save' });
  }
});

// Get saves for a user
router.get('/saves/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }
    
    const userSaves = [];
    interactions.saves.forEach((save) => {
      if (save.userId === userId) {
        userSaves.push(save);
      }
    });
    
    // Sort by timestamp (newest first)
    userSaves.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.status(200).json({
      userId,
      count: userSaves.length,
      saves: userSaves
    });
  } catch (error) {
    console.error('Error retrieving user saves:', error);
    res.status(500).json({ error: 'Failed to retrieve user saves' });
  }
});

// Check if user has saved an item
router.get('/save/check', (req, res) => {
  try {
    const { userId, itemId } = req.query;
    
    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const key = getInteractionKey(userId, itemId);
    const isSaved = interactions.saves.has(key);
    
    res.status(200).json({
      isSaved,
      save: isSaved ? interactions.saves.get(key) : null
    });
  } catch (error) {
    console.error('Error checking save status:', error);
    res.status(500).json({ error: 'Failed to check save status' });
  }
});

module.exports = router; 
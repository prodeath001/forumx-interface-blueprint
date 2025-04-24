const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to check if we're using mock DB
const usingMockDB = () => {
  return global.mockUsers !== undefined;
};

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'forumx_secret_key');
      
      // Get user from token
      if (usingMockDB()) {
        // Find user in mock DB by ID
        const user = Array.from(global.mockUsers.values()).find(u => u._id === decoded.id);
        
        if (!user) {
          return res.status(401).json({ error: 'Not authorized, user not found' });
        }
        
        // Create a user object without the password
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      } else {
        // Get user from MongoDB
        req.user = await User.findById(decoded.id).select('-password');
      }
      
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'forumx_secret_key', {
    expiresIn: '30d' // Token expires in 30 days
  });
}; 
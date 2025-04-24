const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Helper function to check if we're using mock DB
const usingMockDB = () => {
  // First priority: explicit env var to use MongoDB
  if (process.env.USE_MONGODB === 'true') {
    return false; // Not using mock DB, using real MongoDB
  }
  
  // Second priority: are we in development with mock data
  return global.mockUsers !== undefined;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    if (usingMockDB()) {
      // Check if user already exists in mock DB
      const existingUser = Array.from(global.mockUsers.values()).find(
        u => u.username === username || u.email === email
      );
      
      if (existingUser) {
        let field = existingUser.email === email ? 'email' : 'username';
        return res.status(400).json({ error: `User with this ${field} already exists` });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user ID
      const userId = 'user_' + Date.now();
      
      // Create new user in mock DB
      const newUser = {
        _id: userId,
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
        avatar: '',
        bio: '',
        createdAt: new Date()
      };
      
      global.mockUsers.set(username, newUser);
      
      // Generate token
      const token = generateToken(userId);
      
      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({
        ...userWithoutPassword,
        token
      });
    } else {
      // Using real MongoDB
      // Check if user already exists
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      
      if (userExists) {
        let field = userExists.email === email ? 'email' : 'username';
        return res.status(400).json({ error: `User with this ${field} already exists` });
      }
      
      // Create new user
      const user = await User.create({
        username,
        email,
        password,
        displayName: displayName || username
      });
      
      // Generate JWT token
      const token = generateToken(user._id);
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        token
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (usingMockDB()) {
      // Find user in mock DB
      const user = global.mockUsers.get(username) || 
                  Array.from(global.mockUsers.values()).find(u => u.email === username);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate token
      const token = generateToken(user._id);
      
      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        ...userWithoutPassword,
        token
      });
    } else {
      // Using real MongoDB
      // Find user by username or email
      const user = await User.findOne({
        $or: [
          { username },
          { email: username } // Allow login with email as username
        ]
      }).select('+password'); // Include password in the query result
      
      // Check if user exists and password matches
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = generateToken(user._id);
      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        token
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    if (usingMockDB()) {
      // Find user in mock DB by ID (from req.user set in auth middleware)
      const user = Array.from(global.mockUsers.values()).find(u => u._id === req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return user data (excluding password)
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } else {
      // Using real MongoDB
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { displayName, avatar, bio } = req.body;
    
    if (usingMockDB()) {
      // Find user in mock DB by username (from req.user set in auth middleware)
      const username = Array.from(global.mockUsers.keys()).find(
        key => global.mockUsers.get(key)._id === req.user._id
      );
      
      if (!username || !global.mockUsers.has(username)) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = global.mockUsers.get(username);
      
      // Update fields
      user.displayName = displayName || user.displayName;
      user.avatar = avatar || user.avatar;
      user.bio = bio !== undefined ? bio : user.bio;
      
      // Save updated user
      global.mockUsers.set(username, user);
      
      // Return updated user (excluding password)
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } else {
      // Using real MongoDB
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update fields
      user.displayName = displayName || user.displayName;
      user.avatar = avatar || user.avatar;
      user.bio = bio !== undefined ? bio : user.bio;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}; 
const mongoose = require('mongoose');

// Mock user data storage (in-memory)
global.mockUsers = new Map();

const connectDB = async () => {
  // Check if we should use MongoDB or mock data
  const useRealDB = process.env.MONGODB_URI && process.env.USE_MONGODB === 'true';
  
  if (useRealDB) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // These options are optional if using Mongoose >= 6.0
      });
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      console.log('Falling back to mock database...');
      setupMockDB();
    }
  } else {
    console.log('Using mock database for development');
    setupMockDB();
  }
};

// Setup mock database functionality
const setupMockDB = () => {
  // Add a test user if none exists
  if (!global.mockUsers.has('testuser')) {
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('password123', salt);
    
    global.mockUsers.set('testuser', {
      _id: 'user_' + Date.now(),
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      avatar: '',
      bio: 'This is a test user account',
      createdAt: new Date()
    });
    
    console.log('Test user created in mock database');
  }
};

module.exports = connectDB; 
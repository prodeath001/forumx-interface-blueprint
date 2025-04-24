const mongoose = require('mongoose');

// Mock user data storage (in-memory)
global.mockUsers = new Map();
global.mockCommunities = new Map();

const connectDB = async () => {
  // Check if we should use MongoDB or mock data
  const useRealDB = process.env.MONGODB_URI && process.env.USE_MONGODB === 'true';
  
  if (useRealDB) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // Mongoose 6+ no longer needs these options, they're now defaults
        // Adding them explicitly for clarity
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name}`);
      console.log('✅ Using real MongoDB database for auth and data storage');
      return true;
    } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      console.log('Falling back to mock database...');
      setupMockDB();
      return false;
    }
  } else {
    console.log('Using mock database for development');
    console.log('⚠️ Note: Set USE_MONGODB=true in .env file to use real MongoDB');
    setupMockDB();
    return false;
  }
};

// Setup mock database functionality
const setupMockDB = () => {
  // Initialize communities map if it doesn't exist
  if (!global.mockCommunities) {
    global.mockCommunities = new Map();
  }

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
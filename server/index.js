const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const webRTC = require('./webrtc');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
app.set('io', io);

// Make conferences globally accessible for mock DB implementation
global.conferences = new Map();

// Initialize WebRTC signaling
webRTC(io);

// Import and use Cloudinary routes
const cloudinaryRoutes = require('./cloudinary');
app.use('/api/cloudinary', cloudinaryRoutes);

// Import and use Interactions routes
const interactionsRoutes = require('./interactions');
app.use('/api/interactions', interactionsRoutes);

// Import and use Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Import and use Community routes
const communityRoutes = require('./routes/communityRoutes');
app.use('/api/communities', communityRoutes);

// Import and use Room Community routes
const roomCommunityRoutes = require('./routes/roomCommunityRoutes');
app.use('/api', roomCommunityRoutes);

// Store active conferences and participants
const conferences = new Map();
const users = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a conference
  socket.on('join-conference', ({ conferenceId, roomId, userData }) => {
    const user = {
      socketId: socket.id,
      id: userData.id || uuidv4(),
      name: userData.name,
      avatar: userData.avatar,
      isVideoOn: userData.isVideoOn || false,
      isAudioOn: userData.isAudioOn || false,
      isScreenSharing: false,
      isHost: false,
      joinedAt: new Date()
    };

    // Create a new conference if it doesn't exist
    if (!conferences.has(conferenceId)) {
      const newConference = {
        id: conferenceId,
        participants: new Map(),
        rooms: new Map(),
        createdAt: new Date()
      };
      conferences.set(conferenceId, newConference);
      
      // First user to join is the host
      user.isHost = true;
      
      // Create main room
      newConference.rooms.set('main', {
        id: 'main',
        name: 'Main Room',
        participants: new Map(),
        messages: [],
        createdAt: new Date()
      });
    }

    // Get the conference
    const conference = conferences.get(conferenceId);
    
    // Handle room assignment
    const actualRoomId = roomId || 'main';
    
    // Create room if it doesn't exist
    if (!conference.rooms.has(actualRoomId)) {
      conference.rooms.set(actualRoomId, {
        id: actualRoomId,
        name: actualRoomId === 'main' ? 'Main Room' : `Room ${actualRoomId}`,
        participants: new Map(),
        messages: [],
        createdAt: new Date()
      });
    }
    
    const room = conference.rooms.get(actualRoomId);
    
    // Add user to conference and room
    conference.participants.set(user.id, user);
    room.participants.set(user.id, user);
    
    // Store user info
    users.set(socket.id, {
      userId: user.id,
      conferenceId,
      roomId: actualRoomId
    });

    // Join socket rooms
    socket.join(conferenceId);
    socket.join(`${conferenceId}:${actualRoomId}`);

    // Notify conference about the new user
    io.to(conferenceId).emit('user-joined', {
      user,
      participants: Array.from(conference.participants.values()),
      rooms: Array.from(conference.rooms.entries()).map(([id, r]) => ({
        id,
        name: r.name,
        participantCount: r.participants.size
      }))
    });
    
    // Notify room about the new user
    io.to(`${conferenceId}:${actualRoomId}`).emit('user-joined-room', {
      user,
      roomId: actualRoomId,
      roomParticipants: Array.from(room.participants.values()),
      messages: room.messages
    });

    console.log(`User ${user.name} joined conference ${conferenceId}, room ${actualRoomId}`);
  });

  // Change room within a conference
  socket.on('change-room', ({ conferenceId, newRoomId }) => {
    const userInfo = users.get(socket.id);
    if (!userInfo) return;
    
    const conference = conferences.get(conferenceId);
    if (!conference) return;
    
    const user = conference.participants.get(userInfo.userId);
    if (!user) return;
    
    // Leave current room
    const currentRoom = conference.rooms.get(userInfo.roomId);
    if (currentRoom) {
      currentRoom.participants.delete(user.id);
      socket.leave(`${conferenceId}:${userInfo.roomId}`);
      
      // Notify room about user leaving
      io.to(`${conferenceId}:${userInfo.roomId}`).emit('user-left-room', {
        userId: user.id,
        roomParticipants: Array.from(currentRoom.participants.values())
      });
    }
    
    // Create new room if it doesn't exist
    if (!conference.rooms.has(newRoomId)) {
      conference.rooms.set(newRoomId, {
        id: newRoomId,
        name: `Room ${newRoomId}`,
        participants: new Map(),
        messages: [],
        createdAt: new Date()
      });
      
      // Notify conference about new room
      io.to(conferenceId).emit('room-created', {
        id: newRoomId,
        name: `Room ${newRoomId}`,
        participantCount: 0
      });
    }
    
    // Join new room
    const newRoom = conference.rooms.get(newRoomId);
    newRoom.participants.set(user.id, user);
    socket.join(`${conferenceId}:${newRoomId}`);
    
    // Update user info
    userInfo.roomId = newRoomId;
    
    // Notify room about user joining
    io.to(`${conferenceId}:${newRoomId}`).emit('user-joined-room', {
      user,
      roomId: newRoomId,
      roomParticipants: Array.from(newRoom.participants.values()),
      messages: newRoom.messages
    });
    
    console.log(`User ${user.name} changed to room ${newRoomId} in conference ${conferenceId}`);
  });

  // Send a chat message
  socket.on('send-message', ({ conferenceId, message, roomId }) => {
    const userInfo = users.get(socket.id);
    if (!userInfo) return;
    
    const conference = conferences.get(conferenceId);
    if (!conference) return;
    
    const user = conference.participants.get(userInfo.userId);
    if (!user) return;
    
    // Determine target room (user's current room or specified room)
    const targetRoomId = roomId || userInfo.roomId;
    const room = conference.rooms.get(targetRoomId);
    if (!room) return;
    
    const newMessage = {
      id: uuidv4(),
      content: message,
      sender: {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      },
      timestamp: new Date(),
      roomId: targetRoomId
    };
    
    // Store message in room
    room.messages.push(newMessage);
    
    // Send to room participants
    io.to(`${conferenceId}:${targetRoomId}`).emit('new-message', newMessage);
    
    console.log(`New message in conference ${conferenceId}, room ${targetRoomId} from ${user.name}`);
  });

  // Update user media status
  socket.on('update-media', ({ conferenceId, updates }) => {
    const userInfo = users.get(socket.id);
    
    if (!userInfo) return;
    
    const conference = conferences.get(conferenceId);
    
    if (!conference) return;
    
    const user = conference.participants.get(userInfo.userId);
    
    if (!user) return;
    
    // Update user media status
    if (updates.hasOwnProperty('isVideoOn')) {
      user.isVideoOn = updates.isVideoOn;
    }
    
    if (updates.hasOwnProperty('isAudioOn')) {
      user.isAudioOn = updates.isAudioOn;
    }
    
    if (updates.hasOwnProperty('isScreenSharing')) {
      user.isScreenSharing = updates.isScreenSharing;
    }
    
    // Notify all participants about the update
    io.to(conferenceId).emit('user-updated', {
      userId: user.id,
      updates
    });
    
    console.log(`User ${user.name} updated media status in conference ${conferenceId}`);
  });

  // Leave conference
  socket.on('leave-conference', () => {
    handleUserDisconnect(socket.id);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    handleUserDisconnect(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Handle user disconnect or leaving a conference
function handleUserDisconnect(socketId) {
  const userInfo = users.get(socketId);
  
  if (!userInfo) return;
  
  const { userId, conferenceId, roomId } = userInfo;
  const conference = conferences.get(conferenceId);
  
  if (!conference) return;
  
  // Remove user from conference
  const user = conference.participants.get(userId);
  
  if (!user) return;
  
  console.log(`User ${user.name} left conference ${conferenceId}, room ${roomId}`);
  
  // Remove from conference and room
  conference.participants.delete(userId);
  
  const room = conference.rooms.get(roomId);
  if (room) {
    room.participants.delete(userId);
    
    // Notify room that user has left
    io.to(`${conferenceId}:${roomId}`).emit('user-left-room', {
      userId,
      roomParticipants: Array.from(room.participants.values())
    });
    
    // Remove empty rooms (except main)
    if (room.participants.size === 0 && roomId !== 'main') {
      conference.rooms.delete(roomId);
      
      // Notify conference about room removal
      io.to(conferenceId).emit('room-removed', {
        roomId
      });
      
      console.log(`Room ${roomId} removed from conference ${conferenceId} (empty)`);
    }
  }
  
  // Notify conference that user has left
  io.to(conferenceId).emit('user-left', {
    userId,
    participants: Array.from(conference.participants.values())
  });
  
  // Clean up empty conferences
  if (conference.participants.size === 0) {
    conferences.delete(conferenceId);
    console.log(`Conference ${conferenceId} removed (no participants left)`);
  } else if (user.isHost) {
    // If host left, assign a new host
    const participants = Array.from(conference.participants.values());
    if (participants.length > 0) {
      const newHost = participants[0];
      newHost.isHost = true;
      
      io.to(conferenceId).emit('host-changed', {
        newHostId: newHost.id
      });
      
      console.log(`New host assigned in conference ${conferenceId}: ${newHost.name}`);
    }
  }
  
  // Remove user from users map
  users.delete(socketId);
}

// API routes

// Create a new conference
app.post('/api/conferences', (req, res) => {
  const conferenceId = uuidv4();
  
  const newConference = {
    id: conferenceId,
    participants: new Map(),
    rooms: new Map(),
    createdAt: new Date()
  };
  
  // Create main room
  newConference.rooms.set('main', {
    id: 'main',
    name: 'Main Room',
    participants: new Map(),
    messages: [],
    createdAt: new Date()
  });
  
  conferences.set(conferenceId, newConference);
  
  res.status(201).json({ conferenceId });
});

// Create a new room in a conference
app.post('/api/conferences/:id/rooms', (req, res) => {
  const conferenceId = req.params.id;
  const conference = conferences.get(conferenceId);
  
  if (!conference) {
    return res.status(404).json({ error: 'Conference not found' });
  }
  
  const { name } = req.body;
  const roomId = uuidv4();
  
  const newRoom = {
    id: roomId,
    name: name || `Room ${roomId.slice(0, 5)}`,
    participants: new Map(),
    messages: [],
    createdAt: new Date()
  };
  
  conference.rooms.set(roomId, newRoom);
  
  // Notify conference about new room
  io.to(conferenceId).emit('room-created', {
    id: roomId,
    name: newRoom.name,
    participantCount: 0
  });
  
  res.status(201).json({
    id: roomId,
    name: newRoom.name
  });
});

// Get information about a specific conference
app.get('/api/conferences/:id', (req, res) => {
  const conferenceId = req.params.id;
  const conference = conferences.get(conferenceId);
  
  if (!conference) {
    return res.status(404).json({ error: 'Conference not found' });
  }
  
  res.json({
    id: conference.id,
    participantCount: conference.participants.size,
    participants: Array.from(conference.participants.values()),
    rooms: Array.from(conference.rooms.entries()).map(([id, room]) => ({
      id,
      name: room.name,
      participantCount: room.participants.size
    })),
    createdAt: conference.createdAt
  });
});

// Get rooms in a conference
app.get('/api/conferences/:id/rooms', (req, res) => {
  const conferenceId = req.params.id;
  const conference = conferences.get(conferenceId);
  
  if (!conference) {
    return res.status(404).json({ error: 'Conference not found' });
  }
  
  const rooms = Array.from(conference.rooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    participantCount: room.participants.size
  }));
  
  res.json(rooms);
});

// Get specific room in a conference
app.get('/api/conferences/:conferenceId/rooms/:roomId', (req, res) => {
  const { conferenceId, roomId } = req.params;
  const conference = conferences.get(conferenceId);
  
  if (!conference) {
    return res.status(404).json({ error: 'Conference not found' });
  }
  
  const room = conference.rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    name: room.name,
    participantCount: room.participants.size,
    participants: Array.from(room.participants.values())
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
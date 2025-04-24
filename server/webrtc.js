/**
 * WebRTC signaling handler for video conferencing
 */

module.exports = function(io) {
  // Store active peer connections
  const peerConnections = new Map();
  
  // Handle WebRTC signaling
  io.on('connection', (socket) => {
    console.log('WebRTC: Client connected for signaling', socket.id);
    
    // Handle offer from a peer (initiating a connection)
    socket.on('offer', ({ targetId, description, conferenceId }) => {
      console.log(`WebRTC: Received offer from ${socket.id} to ${targetId} in conference ${conferenceId}`);
      
      // Forward the offer to the target peer
      socket.to(targetId).emit('offer', {
        sourceId: socket.id,
        description,
        conferenceId
      });
    });
    
    // Handle answer to an offer
    socket.on('answer', ({ targetId, description }) => {
      console.log(`WebRTC: Received answer from ${socket.id} to ${targetId}`);
      
      // Forward the answer to the original offerer
      socket.to(targetId).emit('answer', {
        sourceId: socket.id,
        description
      });
    });
    
    // Handle ICE candidates
    socket.on('ice-candidate', ({ targetId, candidate }) => {
      if (!targetId || !candidate) return;
      
      console.log(`WebRTC: Received ICE candidate from ${socket.id} to ${targetId}`);
      
      // Forward the ICE candidate to the target peer
      socket.to(targetId).emit('ice-candidate', {
        sourceId: socket.id,
        candidate
      });
    });
    
    // Handle screen sharing start
    socket.on('start-screen-share', ({ conferenceId }) => {
      console.log(`WebRTC: User ${socket.id} started screen sharing in conference ${conferenceId}`);
      
      // Notify everyone in the room
      socket.to(conferenceId).emit('user-screen-share-started', {
        userId: socket.id
      });
    });
    
    // Handle screen sharing stop
    socket.on('stop-screen-share', ({ conferenceId }) => {
      console.log(`WebRTC: User ${socket.id} stopped screen sharing in conference ${conferenceId}`);
      
      // Notify everyone in the room
      socket.to(conferenceId).emit('user-screen-share-stopped', {
        userId: socket.id
      });
    });
    
    // Handle negotiation needed event
    socket.on('negotiation-needed', ({ targetId, conferenceId }) => {
      console.log(`WebRTC: Negotiation needed for ${socket.id} and ${targetId} in conference ${conferenceId}`);
      
      socket.to(targetId).emit('negotiation-needed', {
        sourceId: socket.id,
        conferenceId
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('WebRTC: Client disconnected from signaling', socket.id);
      
      // Clean up peer connections
      const userConnections = peerConnections.get(socket.id);
      if (userConnections) {
        // Notify peers that this user has disconnected
        for (const peerId of userConnections) {
          socket.to(peerId).emit('peer-disconnected', { peerId: socket.id });
        }
        peerConnections.delete(socket.id);
      }
      
      // Remove this user from others' connections
      for (const [userId, connections] of peerConnections.entries()) {
        if (connections.has(socket.id)) {
          connections.delete(socket.id);
          // If this was the last connection, clean up
          if (connections.size === 0) {
            peerConnections.delete(userId);
          }
        }
      }
    });
    
    // Handle direct connection to a specific peer
    socket.on('connect-to-peer', ({ targetId, conferenceId }) => {
      console.log(`WebRTC: User ${socket.id} wants to connect to peer ${targetId} in conference ${conferenceId}`);
      
      // Store peer connection information
      if (!peerConnections.has(socket.id)) {
        peerConnections.set(socket.id, new Set());
      }
      peerConnections.get(socket.id).add(targetId);
      
      if (!peerConnections.has(targetId)) {
        peerConnections.set(targetId, new Set());
      }
      peerConnections.get(targetId).add(socket.id);
      
      // Notify target peer
      socket.to(targetId).emit('peer-connecting', {
        sourceId: socket.id,
        conferenceId
      });
    });
  });
}; 
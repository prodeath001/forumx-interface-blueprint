import { Socket, io } from "socket.io-client";

// Types
export type Message = {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  roomId?: string;
};

export type Participant = {
  id: string;
  socketId: string;
  name: string;
  avatar?: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
  joinedAt: Date;
};

export type Room = {
  id: string;
  name: string;
  participantCount: number;
  participants?: Participant[];
  messages?: Message[];
};

export type CommunityInfo = {
  id: string;
  name: string;
  description: string;
  image?: string;
};

export type ConferenceState = {
  conferenceId: string;
  currentRoomId: string;
  participants: Participant[];
  rooms: Room[];
  roomParticipants: Participant[];
  messages: Message[];
  localStream?: MediaStream;
  screenStream?: MediaStream;
  peerConnections: Map<string, RTCPeerConnection>;
  remoteStreams: Map<string, MediaStream>;
  roomCommunity?: CommunityInfo;
};

export type MediaUpdates = {
  isVideoOn?: boolean;
  isAudioOn?: boolean;
  isScreenSharing?: boolean;
};

// Default configuration for WebRTC peer connections
const defaultRTCConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

class ConferenceService {
  private socket: Socket | null = null;
  private state: ConferenceState = {
    conferenceId: '',
    currentRoomId: '',
    participants: [],
    rooms: [],
    roomParticipants: [],
    messages: [],
    peerConnections: new Map<string, RTCPeerConnection>(),
    remoteStreams: new Map<string, MediaStream>()
  };
  
  private callbacks = {
    onParticipantJoined: (participant: Participant) => {},
    onParticipantLeft: (participantId: string) => {},
    onParticipantUpdated: (participantId: string, updates: MediaUpdates) => {},
    onMessageReceived: (message: Message) => {},
    onConferenceJoined: (state: ConferenceState) => {},
    onRemoteStreamAdded: (participantId: string, stream: MediaStream) => {},
    onRemoteStreamRemoved: (participantId: string) => {},
    onScreenShareStarted: (participantId: string) => {},
    onScreenShareStopped: (participantId: string) => {},
    onHostChanged: (newHostId: string) => {},
    onRoomJoined: (roomId: string, participants: Participant[], messages: Message[]) => {},
    onRoomLeft: (roomId: string) => {},
    onRoomCreated: (room: Room) => {},
    onRoomRemoved: (roomId: string) => {},
    onUserJoinedRoom: (roomId: string, participant: Participant) => {},
    onUserLeftRoom: (roomId: string, participantId: string) => {},
    onError: (error: Error) => {}
  };
  
  private serverUrl = 'http://localhost:5001';
  
  // Connect to the signaling server
  public connect(): void {
    if (this.socket && this.socket.connected) {
      console.log('Already connected to signaling server');
      return;
    }
    
    try {
      this.socket = io(this.serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      this.setupSocketListeners();
      
      // Add connection error handler
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.callbacks.onError(new Error('Failed to connect to conference server'));
      });
      
      // Add connection timeout handler
      this.socket.on('connect_timeout', () => {
        console.error('Socket connection timeout');
        this.callbacks.onError(new Error('Connection to conference server timed out'));
      });
      
      console.log('Connecting to signaling server...');
    } catch (error) {
      console.error('Error initializing socket connection:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error('Failed to initialize socket connection'));
    }
  }
  
  // Disconnect from the signaling server
  public disconnect(): void {
    if (this.socket) {
      // Leave current conference if any
      if (this.state.conferenceId) {
        this.leaveConference();
      }
      
      this.socket.disconnect();
      this.socket = null;
      console.log('Disconnected from signaling server');
    }
  }
  
  // Join a conference
  public async joinConference(
    conferenceId: string, 
    userData: { id?: string; name: string; avatar?: string; },
    roomId?: string,
    withVideo: boolean = true,
    withAudio: boolean = true
  ): Promise<void> {
    if (!this.socket) {
      this.connect();
    }
    
    // Reset conference state even if socket fails, to allow offline mode
    this.state = {
      conferenceId,
      currentRoomId: roomId || 'main',
      participants: [],
      rooms: [],
      roomParticipants: [],
      messages: [],
      localStream: this.state.localStream,
      peerConnections: new Map<string, RTCPeerConnection>(),
      remoteStreams: new Map<string, MediaStream>()
    };
    
    try {
      // Initialize local media stream if video or audio is requested
      if (withVideo || withAudio) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: withVideo,
          audio: withAudio
        });
        
        this.state.localStream = stream;
      }
      
      if (!this.socket || !this.socket.connected) {
        // Fallback for offline mode: create local-only participant
        const localParticipant: Participant = {
          id: userData.id || `user-${Date.now()}`,
          socketId: 'local',
          name: userData.name,
          avatar: userData.avatar,
          isVideoOn: !!withVideo,
          isAudioOn: !!withAudio,
          isScreenSharing: false,
          isHost: true,
          joinedAt: new Date()
        };
        
        this.state.participants = [localParticipant];
        this.state.roomParticipants = [localParticipant];
        
        // Add a default room
        this.state.rooms = [{
          id: 'main',
          name: 'Main Room',
          participantCount: 1
        }];
        
        // Notify application that we've joined (in offline mode)
        setTimeout(() => {
          this.callbacks.onConferenceJoined({...this.state});
        }, 100);
        
        throw new Error('Cannot join conference: Socket connection not established');
      }
      
      // Join the conference
      this.socket.emit('join-conference', {
        conferenceId,
        roomId: roomId || 'main',
        userData: {
          ...userData,
          isVideoOn: !!withVideo,
          isAudioOn: !!withAudio
        }
      });
      
      console.log(`Joining conference ${conferenceId}, room ${roomId || 'main'}...`);
    } catch (error) {
      console.error('Error joining conference:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error('Failed to join conference'));
    }
  }
  
  // Leave the current conference
  public leaveConference(): void {
    if (!this.socket || !this.state.conferenceId) return;
    
    console.log(`Leaving conference ${this.state.conferenceId}...`);
    
    // Notify server
    this.socket.emit('leave-conference');
    
    // Close all peer connections
    this.closePeerConnections();
    
    // Stop local media stream
    this.stopLocalStream();
    
    // Reset state
    this.state = {
      conferenceId: '',
      currentRoomId: '',
      participants: [],
      rooms: [],
      roomParticipants: [],
      messages: [],
      peerConnections: new Map<string, RTCPeerConnection>(),
      remoteStreams: new Map<string, MediaStream>()
    };
  }
  
  // Change room within the conference
  public changeRoom(roomId: string): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot change room: Not connected to a conference');
      return;
    }
    
    if (roomId === this.state.currentRoomId) {
      console.log(`Already in room ${roomId}`);
      return;
    }
    
    this.socket.emit('change-room', {
      conferenceId: this.state.conferenceId,
      newRoomId: roomId
    });
    
    console.log(`Changing to room ${roomId}...`);
  }
  
  // Create a new room
  public createRoom(name?: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.state.conferenceId) {
        const error = new Error('Cannot create room: Not connected to a conference');
        console.error(error);
        reject(error);
        return;
      }
      
      // Make API request to create a new room
      fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to create room');
        }
        return response.json();
      })
      .then(room => {
        resolve(room);
      })
      .catch(error => {
        console.error('Error creating room:', error);
        reject(error);
      });
    });
  }
  
  // Send a chat message to current room or a specific room
  public sendMessage(message: string, roomId?: string): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot send message: Not connected to a conference');
      return;
    }
    
    this.socket.emit('send-message', {
      conferenceId: this.state.conferenceId,
      message,
      roomId: roomId || this.state.currentRoomId
    });
  }
  
  // Update media status (video, audio, screen sharing)
  public updateMedia(updates: MediaUpdates): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot update media: Not connected to a conference');
      return;
    }
    
    // Update local stream based on the requested changes
    if (this.state.localStream) {
      // Handle video track
      if (updates.hasOwnProperty('isVideoOn')) {
        const videoTracks = this.state.localStream.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = updates.isVideoOn as boolean;
        });
      }
      
      // Handle audio track
      if (updates.hasOwnProperty('isAudioOn')) {
        const audioTracks = this.state.localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = updates.isAudioOn as boolean;
        });
      }
    }
    
    // Send update to server
    this.socket.emit('update-media', {
      conferenceId: this.state.conferenceId,
      updates
    });
  }
  
  // Start screen sharing
  public async startScreenShare(): Promise<void> {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot start screen sharing: Not connected to a conference');
      return;
    }
    
    try {
      // Get screen sharing stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      this.state.screenStream = screenStream;
      
      // Notify other participants
      this.socket.emit('start-screen-share', {
        conferenceId: this.state.conferenceId
      });
      
      // Update media status
      this.updateMedia({ isScreenSharing: true });
      
      // Handle stream ending
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };
      
      // Add screen track to all peer connections
      for (const [peerId, pc] of this.state.peerConnections.entries()) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        } else {
          screenStream.getTracks().forEach(track => {
            pc.addTrack(track, screenStream);
          });
        }
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error('Failed to start screen sharing'));
    }
  }
  
  // Stop screen sharing
  public stopScreenShare(): void {
    if (!this.socket || !this.state.conferenceId || !this.state.screenStream) {
      return;
    }
    
    // Stop all tracks
    this.state.screenStream.getTracks().forEach(track => track.stop());
    
    // Clear reference
    this.state.screenStream = undefined;
    
    // Notify other participants
    this.socket.emit('stop-screen-share', {
      conferenceId: this.state.conferenceId
    });
    
    // Update media status
    this.updateMedia({ isScreenSharing: false });
    
    // Revert to camera video if available
    if (this.state.localStream) {
      const videoTrack = this.state.localStream.getVideoTracks()[0];
      
      if (videoTrack) {
        for (const [peerId, pc] of this.state.peerConnections.entries()) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
      }
    }
  }
  
  // Set up various event callbacks
  public on(event: string, callback: any): void {
    if (event in this.callbacks) {
      this.callbacks[event as keyof typeof this.callbacks] = callback;
    }
  }
  
  // Private methods
  
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    // User joined conference
    this.socket.on('user-joined', (data: { 
      user: Participant; 
      participants: Participant[];
      rooms: Room[];
    }) => {
      console.log('User joined conference:', data.user.name);
      
      this.state.participants = data.participants;
      this.state.rooms = data.rooms;
      
      // Notify callback
      this.callbacks.onParticipantJoined(data.user);
      
      // If the user is us, notify that we've joined the conference
      const user = data.participants.find(p => p.socketId === this.socket?.id);
      if (user && user.id === data.user.id) {
        this.callbacks.onConferenceJoined(this.state);
        
        // Create peer connections for all existing participants
        for (const participant of data.participants) {
          // Skip ourselves
          if (participant.socketId === this.socket?.id) continue;
          
          const peerConnection = this.initializePeerConnection(participant.id);
          this.createOffer(participant.id);
        }
      }
    });
    
    // User joined room
    this.socket.on('user-joined-room', (data: {
      user: Participant;
      roomId: string;
      roomParticipants: Participant[];
      messages: Message[];
    }) => {
      console.log(`User joined room ${data.roomId}:`, data.user.name);
      
      // If current user joined a room, update state
      if (data.user.socketId === this.socket?.id) {
        this.state.currentRoomId = data.roomId;
        this.state.roomParticipants = data.roomParticipants;
        
        if (data.messages) {
          this.state.messages = data.messages;
        }
        
        // Notify callback
        this.callbacks.onRoomJoined(data.roomId, data.roomParticipants, data.messages);
      } else {
        // Another user joined the room we're in
        if (data.roomId === this.state.currentRoomId) {
          this.state.roomParticipants = data.roomParticipants;
          
          // Notify callback
          this.callbacks.onUserJoinedRoom(data.roomId, data.user);
        }
      }
    });
    
    // User left conference
    this.socket.on('user-left', (data: { 
      userId: string; 
      participants: Participant[];
    }) => {
      console.log('User left conference:', data.userId);
      
      this.state.participants = data.participants;
      
      // Close peer connection with the participant
      this.closePeerConnection(data.userId);
      
      // Notify callback
      this.callbacks.onParticipantLeft(data.userId);
    });
    
    // User left room
    this.socket.on('user-left-room', (data: {
      userId: string;
      roomId: string;
      roomParticipants: Participant[];
    }) => {
      console.log(`User left room ${data.roomId}:`, data.userId);
      
      // Update room participants if it's our current room
      if (data.roomId === this.state.currentRoomId) {
        this.state.roomParticipants = data.roomParticipants;
        
        // Notify callback
        this.callbacks.onUserLeftRoom(data.roomId, data.userId);
      }
    });
    
    // Room created
    this.socket.on('room-created', (room: Room) => {
      console.log('Room created:', room.name);
      
      // Add to rooms list
      this.state.rooms = [...this.state.rooms, room];
      
      // Notify callback
      this.callbacks.onRoomCreated(room);
    });
    
    // Room removed
    this.socket.on('room-removed', (data: { roomId: string; }) => {
      console.log('Room removed:', data.roomId);
      
      // Remove from rooms list
      this.state.rooms = this.state.rooms.filter(r => r.id !== data.roomId);
      
      // Notify callback
      this.callbacks.onRoomRemoved(data.roomId);
    });
    
    // User updated media
    this.socket.on('user-updated', (data: { 
      userId: string; 
      updates: MediaUpdates;
    }) => {
      console.log('User updated:', data.userId, data.updates);
      
      // Update participant in state
      const participantIndex = this.state.participants.findIndex(p => p.id === data.userId);
      if (participantIndex !== -1) {
        this.state.participants[participantIndex] = {
          ...this.state.participants[participantIndex],
          ...data.updates
        };
      }
      
      // Update room participant in state if applicable
      const roomParticipantIndex = this.state.roomParticipants.findIndex(p => p.id === data.userId);
      if (roomParticipantIndex !== -1) {
        this.state.roomParticipants[roomParticipantIndex] = {
          ...this.state.roomParticipants[roomParticipantIndex],
          ...data.updates
        };
      }
      
      // Notify callback
      this.callbacks.onParticipantUpdated(data.userId, data.updates);
    });
    
    // New message received
    this.socket.on('new-message', (message: Message) => {
      console.log('New message:', message);
      
      // Only add message to state if it's in the current room
      if (!message.roomId || message.roomId === this.state.currentRoomId) {
        this.state.messages.push(message);
        
        // Notify callback
        this.callbacks.onMessageReceived(message);
      }
    });
    
    // Handle host changed event
    this.socket.on('host-changed', ({ newHostId }) => {
      // Update state
      for (const participant of this.state.participants) {
        participant.isHost = participant.id === newHostId;
      }
      
      // Call callback
      this.callbacks.onHostChanged(newHostId);
    });
    
    // WebRTC signaling events
    
    // Handle incoming connection request
    this.socket.on('peer-connecting', ({ sourceId, conferenceId }) => {
      console.log(`Peer ${sourceId} is connecting`);
      this.initializePeerConnection(sourceId);
    });
    
    // Handle offer from another peer
    this.socket.on('offer', async ({ sourceId, description }) => {
      try {
        console.log(`Received offer from ${sourceId}`);
        
        let pc = this.state.peerConnections.get(sourceId);
        
        if (!pc) {
          pc = this.initializePeerConnection(sourceId);
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.socket?.emit('answer', {
          targetId: sourceId,
          description: answer
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });
    
    // Handle answer to our offer
    this.socket.on('answer', async ({ sourceId, description }) => {
      try {
        console.log(`Received answer from ${sourceId}`);
        
        const pc = this.state.peerConnections.get(sourceId);
        
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(description));
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });
    
    // Handle ICE candidate
    this.socket.on('ice-candidate', ({ sourceId, candidate }) => {
      try {
        console.log(`Received ICE candidate from ${sourceId}`);
        
        const pc = this.state.peerConnections.get(sourceId);
        
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });
    
    // Handle negotiation needed
    this.socket.on('negotiation-needed', ({ sourceId }) => {
      console.log(`Negotiation needed with ${sourceId}`);
      this.createOffer(sourceId);
    });
    
    // Handle peer disconnected
    this.socket.on('peer-disconnected', ({ peerId }) => {
      console.log(`Peer ${peerId} disconnected`);
      this.closePeerConnection(peerId);
    });
    
    // Handle screen sharing events
    this.socket.on('user-screen-share-started', ({ userId }) => {
      this.callbacks.onScreenShareStarted(userId);
    });
    
    this.socket.on('user-screen-share-stopped', ({ userId }) => {
      this.callbacks.onScreenShareStopped(userId);
    });
    
    // Handle community created event
    this.socket.on('community-created', (communityInfo: CommunityInfo) => {
      console.log('Community created for room:', communityInfo);
      
      // Update state
      this.state.roomCommunity = communityInfo;
      
      // Notify all listeners that might be interested
      // You might want to add a specific callback for this
    });
  }
  
  // Initialize a WebRTC peer connection with another participant
  private initializePeerConnection(peerId: string): RTCPeerConnection {
    console.log(`Initializing peer connection with ${peerId}`);
    
    // Create new RTCPeerConnection
    const pc = new RTCPeerConnection(defaultRTCConfig);
    
    // Store in state
    this.state.peerConnections.set(peerId, pc);
    
    // Add local stream tracks to the connection
    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.state.localStream!);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('ice-candidate', {
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId} changed to: ${pc.connectionState}`);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeerConnection(peerId);
      }
    };
    
    // Handle remote streams
    pc.ontrack = (event) => {
      console.log(`Received track from ${peerId}`);
      
      // Create or get existing remote stream
      let remoteStream = this.state.remoteStreams.get(peerId);
      
      if (!remoteStream) {
        remoteStream = new MediaStream();
        this.state.remoteStreams.set(peerId, remoteStream);
      }
      
      // Add track to stream
      remoteStream.addTrack(event.track);
      
      // Call callback
      this.callbacks.onRemoteStreamAdded(peerId, remoteStream);
    };
    
    // Notify the other peer to initialize connection
    this.socket?.emit('connect-to-peer', {
      targetId: peerId,
      conferenceId: this.state.conferenceId
    });
    
    // Create offer if we're the initiator
    this.createOffer(peerId);
    
    return pc;
  }
  
  // Create and send an offer to a peer
  private async createOffer(peerId: string): Promise<void> {
    try {
      const pc = this.state.peerConnections.get(peerId);
      
      if (!pc) {
        console.error(`Cannot create offer: No peer connection with ${peerId}`);
        return;
      }
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      
      this.socket?.emit('offer', {
        targetId: peerId,
        description: offer,
        conferenceId: this.state.conferenceId
      });
      
      console.log(`Sent offer to ${peerId}`);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }
  
  // Close a specific peer connection
  private closePeerConnection(peerId: string): void {
    const pc = this.state.peerConnections.get(peerId);
    
    if (pc) {
      pc.close();
      this.state.peerConnections.delete(peerId);
    }
    
    // Remove remote stream
    if (this.state.remoteStreams.has(peerId)) {
      this.state.remoteStreams.delete(peerId);
      this.callbacks.onRemoteStreamRemoved(peerId);
    }
  }
  
  // Close all peer connections
  private closePeerConnections(): void {
    for (const [peerId, pc] of this.state.peerConnections.entries()) {
      pc.close();
      this.callbacks.onRemoteStreamRemoved(peerId);
    }
    
    this.state.peerConnections.clear();
    this.state.remoteStreams.clear();
  }
  
  // Stop local media stream
  private stopLocalStream(): void {
    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach(track => track.stop());
      this.state.localStream = undefined;
    }
    
    if (this.state.screenStream) {
      this.state.screenStream.getTracks().forEach(track => track.stop());
      this.state.screenStream = undefined;
    }
  }
  
  // Check if the current room has an associated community
  public async checkRoomCommunity(): Promise<{ hasCommunity: boolean, communityId?: string }> {
    if (!this.state.conferenceId || !this.state.currentRoomId) {
      console.error('Cannot check room community: Not connected to a conference or room');
      return { hasCommunity: false };
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/rooms/${this.state.currentRoomId}/community/check`);
      
      if (!response.ok) {
        throw new Error('Failed to check room community');
      }
      
      const data = await response.json();
      return {
        hasCommunity: data.hasCommunity,
        communityId: data.communityId
      };
    } catch (error) {
      console.error('Error checking room community:', error);
      return { hasCommunity: false };
    }
  }
  
  // Get the community associated with the current room
  public async getRoomCommunity(): Promise<CommunityInfo | null> {
    if (!this.state.conferenceId || !this.state.currentRoomId) {
      console.error('Cannot get room community: Not connected to a conference or room');
      return null;
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/rooms/${this.state.currentRoomId}/community`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to get room community');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const community: CommunityInfo = {
          id: data.data._id || data.data.id,
          name: data.data.name,
          description: data.data.description,
          image: data.data.image
        };
        
        // Update state
        this.state.roomCommunity = community;
        
        return community;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting room community:', error);
      return null;
    }
  }
  
  // Create a community from the current room
  public async createCommunityFromRoom(communityData: {
    name: string;
    description: string;
    tags?: string[];
    isPrivate?: boolean;
    image?: string;
  }): Promise<CommunityInfo | null> {
    if (!this.state.conferenceId || !this.state.currentRoomId) {
      console.error('Cannot create community: Not connected to a conference or room');
      return null;
    }
    
    try {
      // Check if the user is authenticated
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required to create a community');
      }
      
      const response = await fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/rooms/${this.state.currentRoomId}/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(communityData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create community from room');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const community: CommunityInfo = {
          id: data.data._id || data.data.id,
          name: data.data.name,
          description: data.data.description,
          image: data.data.image
        };
        
        // Update state
        this.state.roomCommunity = community;
        
        return community;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating community from room:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error('Failed to create community'));
      return null;
    }
  }
}

// Export singleton instance
export const conferenceService = new ConferenceService();
export default conferenceService; 
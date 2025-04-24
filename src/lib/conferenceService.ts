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
  isPrivate?: boolean;
  template?: string;
  description?: string;
  capacity?: number;
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
  isAudioEnabled: boolean;
};

export type MediaUpdates = {
  isVideoOn?: boolean;
  isAudioOn?: boolean;
  isScreenSharing?: boolean;
  isAudioEnabled?: boolean;
};

// Default configuration for WebRTC peer connections
const defaultRTCConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

// Define RoomCreateOptions interface
export interface RoomCreateOptions {
  name: string;
  isPrivate?: boolean;
  template?: string;
  description?: string;
  capacity?: number;
}

// Update the callback interface to match the implementation
type ConferenceCallbacks = {
  onError: (error: Error) => void;
  onJoined: (participants: Participant[]) => void;
  onLeft: () => void;
  onUserJoined: (user: Participant) => void;
  onUserLeft: (userId: string) => void;
  onMessageReceived: (message: Message) => void;
  onRoomCreated: (room: Room) => void;
  onRoomJoined: (roomId: string, participants: Participant[], messages: Message[]) => void;
  onUserJoinedRoom: (data: { user: Participant, roomId: string }) => void;
  onUserLeftRoom: (data: { userId: string, roomId: string }) => void;
  onMediaUpdated: (userId: string, updates: MediaUpdates) => void;
  onHandRaised: (userId: string) => void;
  onHandLowered: (userId: string) => void;
  onReaction: (userId: string, reaction: string) => void;
  onMutedByHost: (userId: string) => void;
  onHostChanged: (userId: string) => void;
  onScreenShareStarted: (userId: string, stream: MediaStream) => void;
  onScreenShareStopped: (userId: string) => void;
  onRoomRemoved: (roomId: string) => void;
  onRemoteStreamAdded: (userId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (userId: string) => void;
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
    remoteStreams: new Map<string, MediaStream>(),
    isAudioEnabled: true
  };
  
  // Define the callback types at the class level
  private callbacks: ConferenceCallbacks = {
    onError: () => {},
    onJoined: () => {},
    onLeft: () => {},
    onUserJoined: () => {},
    onUserLeft: () => {},
    onMessageReceived: () => {},
    onRoomCreated: () => {},
    onRoomJoined: () => {},
    onUserJoinedRoom: () => {},
    onUserLeftRoom: () => {},
    onMediaUpdated: () => {},
    onHandRaised: () => {},
    onHandLowered: () => {},
    onReaction: () => {},
    onMutedByHost: () => {},
    onHostChanged: () => {},
    onScreenShareStarted: () => {},
    onScreenShareStopped: () => {},
    onRoomRemoved: () => {},
    onRemoteStreamAdded: () => {},
    onRemoteStreamRemoved: () => {}
  };
  
  private serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5001' 
    : window.location.protocol + '//' + window.location.hostname + (window.location.hostname === 'localhost' ? ':5001' : '');
  
  // Detect if we're running in a browser environment that might have connectivity limitations
  private detectEnvironmentIssues(): { hasIssues: boolean, details: string } {
    try {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
      const isFirefox = /Firefox/.test(ua);
      const isEdge = /Edg/.test(ua);
      const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
      
      // Get browser details for logging
      const browserInfo = {
        userAgent: ua,
        isIOS,
        isSafari,
        isFirefox,
        isEdge,
        isChrome
      };
      
      console.log('Browser environment:', browserInfo);
      
      // Check for known problematic browser combinations
      if (isIOS && isSafari) {
        return { 
          hasIssues: true, 
          details: 'Safari on iOS has known issues with WebSocket connections. You may experience connection problems.'
        };
      }
      
      return { hasIssues: false, details: '' };
    } catch (error) {
      console.error('Error detecting environment:', error);
      return { hasIssues: false, details: '' };
    }
  }
  
  // Connect to the signaling server
  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        console.log('Already connected to signaling server');
        resolve(true);
        return;
      }
      
      // Detect environment issues that might affect connection
      const environmentCheck = this.detectEnvironmentIssues();
      if (environmentCheck.hasIssues) {
        console.warn(`Environment issue detected: ${environmentCheck.details}`);
      }
      
      try {
        // First check if server is available before attempting socket connection
        this.checkServerConnectivity().then(isConnected => {
          if (!isConnected) {
            console.error('Server appears to be offline, socket connection will likely fail');
            this.callbacks.onError(new Error('Conference server is offline. Please try again later.'));
            resolve(false);
            return;
          }
          
          console.log('Connecting to signaling server at:', this.serverUrl);
          
          // Determine optimal transport based on environment
          const transports = environmentCheck.hasIssues 
            ? ['polling', 'websocket'] // Fall back to polling first for problematic browsers
            : ['websocket', 'polling']; // Prefer WebSocket for modern browsers
          
          // Initialize socket with more explicit options for troubleshooting
          this.socket = io(this.serverUrl, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true,
            forceNew: true,
            transports,
            upgrade: true,
            withCredentials: false,
            rejectUnauthorized: false,
            extraHeaders: {
              'Cache-Control': 'no-cache'
            }
          });
          
          // Set a timeout to force resolution if connect events don't fire
          const connectionTimeout = setTimeout(() => {
            if (this.socket && !this.socket.connected) {
              console.error('Socket connection timed out');
              this.callbacks.onError(new Error('Connection to conference server timed out. Please try again.'));
              resolve(false);
            }
          }, 8000);
          
          this.setupSocketListeners();
          
          // Handle successful connection
          this.socket.on('connect', () => {
            console.log('Successfully connected to server:', this.socket?.id);
            clearTimeout(connectionTimeout);
            resolve(true);
          });
          
          // Add connection error handler
          this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            
            // Try fallback to polling if WebSocket fails
            if (this.socket?.io?.opts?.transports?.[0] === 'websocket') {
              console.log('WebSocket connection failed, falling back to polling...');
              this.socket.io.opts.transports = ['polling'];
            }
            
            this.callbacks.onError(new Error(`Failed to connect to conference server: ${error.message}`));
            clearTimeout(connectionTimeout);
            resolve(false);
          });
          
          // Add connection timeout handler
          this.socket.on('connect_timeout', () => {
            console.error('Socket connection timeout');
            this.callbacks.onError(new Error('Connection to conference server timed out. Please try again.'));
            clearTimeout(connectionTimeout);
            resolve(false);
          });
          
          // Force socket connection to ensure it tries immediately
          this.socket.connect();
        });
      } catch (error) {
        console.error('Error initializing socket connection:', error);
        this.callbacks.onError(error instanceof Error ? error : new Error('Failed to initialize socket connection'));
        resolve(false);
      }
    });
  }
  
  // Attempt to reconnect to the signaling server
  public async reconnect(): Promise<boolean> {
    // First disconnect if already connected
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Check server availability
    const isServerAvailable = await this.checkServerConnectivity();
    if (!isServerAvailable) {
      console.error('Cannot reconnect: Server is offline');
      this.callbacks.onError(new Error('Server is offline. Please try again later.'));
      return false;
    }
    
    return this.connect();
  }
  
  // Hard reset for more severe connection issues
  public async hardReset(): Promise<boolean> {
    console.log('Performing hard reset of connection...');
    
    // Completely close any existing connection
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (e) {
        console.error('Error during socket cleanup:', e);
      }
      this.socket = null;
    }
    
    // Stop all media
    this.stopLocalStream();
    
    // Close all peer connections
    this.closePeerConnections();
    
    // Save conference state for rejoining
    const conferenceId = this.state.conferenceId;
    const roomId = this.state.currentRoomId;
    
    // Reset state
    this.state = {
      conferenceId: '',
      currentRoomId: '',
      participants: [],
      rooms: [],
      roomParticipants: [],
      messages: [],
      peerConnections: new Map<string, RTCPeerConnection>(),
      remoteStreams: new Map<string, MediaStream>(),
      isAudioEnabled: true
    };
    
    // Clear URL's cache (helps with some browser caching issues)
    const cacheBustingUrl = `${this.serverUrl}/api/health?cache=${Date.now()}`;
    try {
      await fetch(cacheBustingUrl, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch (e) {
      console.log('Cache busting request failed, continuing anyway');
    }
    
    // Attempt to reconnect
    const connected = await this.connect();
    
    if (connected && conferenceId) {
      console.log('Successfully reconnected, will attempt to rejoin conference:', conferenceId);
      this.state.conferenceId = conferenceId;
      this.state.currentRoomId = roomId;
    }
    
    return connected;
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
    // Try to connect if no socket exists or not connected
    if (!this.socket || !this.socket.connected) {
      const connectionSuccess = await this.connect();
      
      // If connection failed, try one more time
      if (!connectionSuccess) {
        console.log('Initial connection failed, attempting to reconnect...');
        const retrySuccess = await this.reconnect();
        
        if (!retrySuccess) {
          console.error('Failed to connect to server after retry');
          // Continue in offline mode
        }
      }
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
      remoteStreams: new Map<string, MediaStream>(),
      isAudioEnabled: true
    };
    
    try {
      // Initialize local media stream if video or audio is requested
      if (withVideo || withAudio) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: withVideo,
            audio: withAudio
          });
          
          this.state.localStream = stream;
        } catch (mediaError) {
          console.error('Error accessing media devices:', mediaError);
          // Continue without media
        }
      }
      
      if (!this.socket || !this.socket.connected) {
        // Fallback for offline mode: create local-only participant
        const localParticipant: Participant = {
          id: userData.id || `user-${Date.now()}`,
          socketId: 'local',
          name: userData.name,
          avatar: userData.avatar,
          isVideoOn: !!withVideo && !!this.state.localStream,
          isAudioOn: !!withAudio && !!this.state.localStream,
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
          this.callbacks.onJoined(this.state.participants);
        }, 100);
        
        throw new Error('Cannot join conference: Socket connection not established. You are currently in offline mode.');
      }
      
      // Join the conference
      this.socket.emit('join-conference', {
        conferenceId,
        roomId: roomId || 'main',
        userData: {
          ...userData,
          isVideoOn: !!withVideo && !!this.state.localStream,
          isAudioOn: !!withAudio && !!this.state.localStream
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
      remoteStreams: new Map<string, MediaStream>(),
      isAudioEnabled: true
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
  
  // Leave current room but stay in conference
  public leaveRoom(): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot leave room: Not connected to a conference');
      return;
    }
    
    // If user is in main room, there's nowhere to go
    if (this.state.currentRoomId === 'main') {
      console.log('Already in main room, cannot leave');
      return;
    }
    
    // Change to the main room, which acts as leaving the current room
    this.socket.emit('change-room', {
      conferenceId: this.state.conferenceId,
      newRoomId: 'main'
    });
    
    console.log(`Leaving room ${this.state.currentRoomId}, returning to main room...`);
  }
  
  // Add a method to check server connectivity
  public async checkServerConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try multiple endpoints to verify server is truly online
      const healthCheckUrl = `${this.serverUrl}/api/health`;
      const fallbackUrl = `${this.serverUrl}/api/conferences`;
      
      // Try health endpoint first
      let response = await fetch(healthCheckUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).catch(() => null);
      
      // If health check fails, try the fallback endpoint
      if (!response || !response.ok) {
        console.log('Health check failed, trying fallback endpoint');
        response = await fetch(fallbackUrl, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(() => null);
      }
      
      clearTimeout(timeoutId);
      
      // Check if any of the attempts succeeded
      const isConnected = response !== null && response.ok;
      console.log(`Server connectivity check: ${isConnected ? 'Online' : 'Offline'}`);
      return isConnected;
    } catch (error) {
      console.error('Server connectivity check failed:', error);
      return false;
    }
  }
  
  // Fallback method to create room locally if server is unavailable
  private createLocalRoom(options: string | RoomCreateOptions): Room {
    const roomData = typeof options === 'string' ? { name: options } : options;
    const roomId = 'local-' + Math.random().toString(36).substring(2, 9);
    
    const room: Room = {
      id: roomId,
      name: roomData.name,
      participantCount: 1,
      isPrivate: roomData.isPrivate || false,
      template: roomData.template || 'standard',
      description: roomData.description || '',
      capacity: roomData.capacity || 10
    };
    
    // Update state to include this room
    this.state.rooms.push(room);
    
    // Set as current room
    this.state.currentRoomId = roomId;
    
    // Update local participants
    if (this.state.participants.length > 0) {
      const localUser = this.state.participants[0];
      this.state.roomParticipants = [localUser];
    }
    
    return room;
  }
  
  // Add a method to check if connected to a conference
  public isConnectedToConference(): boolean {
    return !!this.socket && !!this.socket.connected && !!this.state.conferenceId;
  }
  
  // Create a new room
  public async createRoom(options: string | RoomCreateOptions): Promise<Room> {
    try {
      if (!this.isConnectedToConference()) {
        const error = new Error('Cannot create room: Not connected to a conference');
        console.error(error);
        this.callbacks.onError(error);
        throw error;
      }
      
      // Log the options for debugging
      console.log('Creating room with options:', options);
      
      // Handle string input for backward compatibility
      const roomData = typeof options === 'string' 
        ? { name: options } 
        : options;
      
      // Validate room name
      if (!roomData.name || roomData.name.trim() === '') {
        const error = new Error('Room name is required');
        console.error(error);
        throw error;
      }
      
      // Check server connectivity first
      const isServerConnected = await this.checkServerConnectivity().catch(() => false);
      
      if (!isServerConnected) {
        console.warn('Server unreachable, creating local room instead');
        return this.createLocalRoom(roomData);
      }
      
      // Make API request to create a new room
      const response = await fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData),
        // Add timeout to avoid hanging requests
        signal: AbortSignal.timeout(10000)
      });
      
      console.log('Room creation response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response text:', responseText);
        
        let errorMessage = 'Failed to create room';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If the response is not valid JSON, use the text directly
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const room = await response.json();
      console.log('Room created successfully:', room);
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      
      // If the error is a network error (failed to fetch), create a local room
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('Network request failed'))) {
        console.warn('Network error detected, creating local room instead');
        const roomData = typeof options === 'string' ? { name: options } : options;
        return this.createLocalRoom(roomData);
      }
      
      throw error;
    }
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
  
  // Update participant info such as avatar, name, etc.
  public updateParticipantInfo(updates: Partial<Participant>): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot update participant info: Not connected to a conference');
      return;
    }
    
    // Send update to server
    this.socket.emit('update-media', {
      conferenceId: this.state.conferenceId,
      updates
    });
    
    // Also update local participant in state
    const currentUser = this.state.participants.find(p => p.socketId === this.socket?.id);
    if (currentUser) {
      Object.assign(currentUser, updates);
      
      // Update in room participants as well if present
      const roomParticipant = this.state.roomParticipants.find(p => p.id === currentUser.id);
      if (roomParticipant) {
        Object.assign(roomParticipant, updates);
      }
    }
  }
  
  // Start screen sharing
  public startScreenShare(stream: MediaStream): void {
    // Set the screen stream
    this.state.screenStream = stream;

    // Notify server and participants
    if (this.socket) {
      this.updateMedia({ isScreenSharing: true, isAudioEnabled: this.state.isAudioEnabled });
    }

    // Add listeners to detect when the user stops sharing via browser UI
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        this.stopScreenShare();
      };
    }
  }
  
  // Stop screen sharing
  public stopScreenShare(): void {
    if (this.state.screenStream) {
      // Stop all tracks
      const tracks = this.state.screenStream.getTracks();
      tracks.forEach(track => track.stop());

      // Clear screen stream reference
      this.state.screenStream = null;

      // Notify server and participants
      if (this.socket) {
        this.updateMedia({ isScreenSharing: false, isAudioEnabled: this.state.isAudioEnabled });
      }

      // Revert to local camera video if available
      // ... handle video revert logic if needed ...
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
    
    // Clear previous listeners to avoid duplicates
    this.socket.off('user-joined');
    this.socket.off('user-left');
    this.socket.off('user-joined-room');
    this.socket.off('user-left-room');
    this.socket.off('receive-message');
    this.socket.off('media-updated');
    this.socket.off('user-disconnected');
    this.socket.off('reconnect');
    this.socket.off('reconnect_error');
    this.socket.off('reconnect_failed');
    this.socket.off('connect_error');
    this.socket.off('disconnect');
    this.socket.off('room-created');
    
    // Add offs for new events
    this.socket.off('hand-raised');
    this.socket.off('hand-lowered');
    this.socket.off('reaction');
    this.socket.off('muted-by-host');

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
      this.callbacks.onUserJoined(data.user);
      
      // If the user is us, notify that we've joined the conference
      const user = data.participants.find(p => p.socketId === this.socket?.id);
      if (user && user.id === data.user.id) {
        this.callbacks.onJoined(this.state.participants);

        // Create peer connections for all existing participants
        for (const participant of data.participants) {
          // Skip ourselves
          if (participant.socketId === this.socket?.id) continue;
          
          const peerConnection = this.initializePeerConnection(participant.id);
          this.createOffer(participant.id);
        }
      }
    });
    
    // Handle user joined room socket event
    this.socket.on('user-joined-room', (data: { 
      userId: string; 
      roomId: string; 
      roomParticipants: Participant[];
    }) => {
      console.log(`User ${data.userId} joined room ${data.roomId}`);
      
      // Find the room and update its participants
      const roomIndex = this.state.rooms.findIndex(r => r.id === data.roomId);
      if (roomIndex !== -1) {
        this.state.rooms[roomIndex].participants = data.roomParticipants;
        
        // Find the user who joined
        const joinedUser = data.roomParticipants.find(p => p.id === data.userId);
        
        // Notify callback
        if (joinedUser) {
          this.callbacks.onUserJoinedRoom({ 
            user: joinedUser, 
            roomId: data.roomId 
          });
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
      this.callbacks.onLeft();
    });
    
    // User left room
    this.socket.on('user-left-room', (data: {
      userId: string;
      roomId: string;
      roomParticipants: Participant[];
    }) => {
      console.log(`User ${data.userId} left room ${data.roomId}`);
      
      // Find the room and update its participants
      const roomIndex = this.state.rooms.findIndex(r => r.id === data.roomId);
      if (roomIndex !== -1) {
        this.state.rooms[roomIndex].participants = data.roomParticipants;
        
        // Notify callback
        this.callbacks.onUserLeftRoom({
          userId: data.userId,
          roomId: data.roomId
        });
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
      this.callbacks.onMediaUpdated(data.userId, data.updates);
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

    // Room removed
    this.socket.on('room-removed', (data: { roomId: string; }) => {
      console.log('Room removed:', data.roomId);
      
      // Remove from rooms list
      this.state.rooms = this.state.rooms.filter(r => r.id !== data.roomId);
      
      // Notify callback
      this.callbacks.onRoomRemoved(data.roomId);
    });

    // Add new event listeners
    this.socket.on('hand-raised', (data: { userId: string, userName: string }) => {
      console.log(`${data.userName} raised their hand`);
      // Update UI or state as needed
      if (this.callbacks['hand-raised']) {
        this.callbacks['hand-raised'](data);
      }
    });

    this.socket.on('hand-lowered', (data: { userId: string, userName: string }) => {
      console.log(`${data.userName} lowered their hand`);
      // Update UI or state as needed
      if (this.callbacks['hand-lowered']) {
        this.callbacks['hand-lowered'](data);
      }
    });

    this.socket.on('reaction', (data: { userId: string, userName: string, reactionType: string }) => {
      console.log(`${data.userName} reacted with ${data.reactionType}`);
      // Update UI or state as needed
      if (this.callbacks['reaction']) {
        this.callbacks['reaction'](data);
      }
    });

    this.socket.on('muted-by-host', () => {
      console.log('You were muted by the host');
      
      // If we have local stream, mute it
      if (this.state.localStream) {
        const audioTracks = this.state.localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = false;
        });
      }
      
      // Update our media state
      this.state.isAudioEnabled = false;
      
      // Notify application
      if (this.callbacks['muted-by-host']) {
        this.callbacks['muted-by-host']();
      }
      
      // Send updated media state to server
      this.updateMedia({ isAudioEnabled: false });
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
  
  // Mute all participants (host only)
  public muteAllParticipants(roomId?: string): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot mute all: Not connected to a conference');
      return;
    }

    this.socket.emit('mute-all', {
      conferenceId: this.state.conferenceId,
      roomId: roomId || this.state.currentRoomId
    });
    
    console.log(`Requested to mute all participants in room ${roomId || this.state.currentRoomId}`);
  }
  
  // Raise hand to request attention
  public raiseHand(): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot raise hand: Not connected to a conference');
      return;
    }
    
    this.socket.emit('raise-hand', {
      conferenceId: this.state.conferenceId
    });
    
    console.log('Raised hand signal sent');
  }
  
  // Lower hand after being acknowledged
  public lowerHand(): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot lower hand: Not connected to a conference');
      return;
    }
    
    this.socket.emit('lower-hand', {
      conferenceId: this.state.conferenceId
    });
    
    console.log('Lowered hand signal sent');
  }
  
  // Send reaction (emoji)
  public sendReaction(reactionType: 'thumbs-up' | 'clap' | 'heart' | 'laugh' | 'surprised' | 'sad'): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot send reaction: Not connected to a conference');
      return;
    }
    
    this.socket.emit('send-reaction', {
      conferenceId: this.state.conferenceId,
      reactionType
    });
    
    console.log(`Sent reaction: ${reactionType}`);
  }
  
  // Get detailed stats about the conference
  public async getConferenceStats(): Promise<any> {
    if (!this.state.conferenceId) {
      console.error('Cannot get stats: Not connected to a conference');
      return null;
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to get conference stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting conference stats:', error);
      return null;
    }
  }
  
  // Kick a participant (host only)
  public kickParticipant(participantId: string): void {
    if (!this.socket || !this.state.conferenceId) {
      console.error('Cannot kick participant: Not connected to a conference');
      return;
    }
    
    // Check if current user is host
    const currentUser = this.state.participants.find(p => p.socketId === this.socket?.id);
    if (!currentUser?.isHost) {
      console.error('Only hosts can kick participants');
      return;
    }
    
    // Make API request to kick the participant
    fetch(`${this.serverUrl}/api/conferences/${this.state.conferenceId}/kick/${participantId}`, {
      method: 'POST'
    }).then(response => {
      if (!response.ok) {
        console.error('Failed to kick participant');
      }
    }).catch(error => {
      console.error('Error kicking participant:', error);
    });
  }
}

// Export singleton instance
export const conferenceService = new ConferenceService();
export default conferenceService; 
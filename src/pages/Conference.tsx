import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare,
  Users,
  Send,
  PlusCircle,
  Share2,
  MoreVertical,
  Settings,
  Camera,
  Image,
  ArrowUp,
  ArrowDown,
  BookmarkPlus,
  LayoutGrid,
  LogOut,
  Globe,
  Users2,
  DoorOpen,
  Home,
  Crown,
  UserCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Monitor,
  Maximize,
  RefreshCw,
  Check
} from "lucide-react";
import { cloudinaryService } from "@/lib/cloudinaryService";
import conferenceService, { 
  Participant as ParticipantType, 
  Message as MessageType,
  Room as RoomType,
  CommunityInfo
} from "@/lib/conferenceService";
import { uuid } from '@/lib/utils';
import { interactionsService, ItemType } from "@/lib/interactionsService";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type Message = {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
};

type Participant = {
  id: string;
  name: string;
  avatar?: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
};

type Room = {
  id: string;
  name: string;
  participantCount: number;
};

const Conference = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [conferenceId, setConferenceId] = useState<string>("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string>('main');
  const [roomParticipants, setRoomParticipants] = useState<Participant[]>([]);
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateCommunityDialog, setShowCreateCommunityDialog] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [communityTags, setCommunityTags] = useState("");
  const [isPrivateCommunity, setIsPrivateCommunity] = useState(false);
  const [roomCommunity, setRoomCommunity] = useState<CommunityInfo | null>(null);
  const [isCheckingCommunity, setIsCheckingCommunity] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomPrivacy, setRoomPrivacy] = useState<'public' | 'private'>('public');
  const [roomTemplate, setRoomTemplate] = useState<string>('standard');
  const [roomDescription, setRoomDescription] = useState<string>('');
  const [roomCapacity, setRoomCapacity] = useState<number>(10);
  const [roomTemplates, setRoomTemplates] = useState([
    { id: 'standard', name: 'Standard Meeting', description: 'General purpose meeting room' },
    { id: 'classroom', name: 'Classroom', description: 'Layout optimized for teaching' },
    { id: 'webinar', name: 'Webinar', description: 'Presentation-focused with audience management' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [commentMessageId, setCommentMessageId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // State for connection status
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Add these state variables with the other state declarations
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Add a state for room creation errors
  const [roomCreationError, setRoomCreationError] = useState<string | null>(null);

  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&auto=format&fit=crop");
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize conference
    const initConference = async () => {
      try {
        // Reset any previous errors
        setConnectionError(null);
        
        // Create or join conference
        const urlParams = new URLSearchParams(window.location.search);
        let confId = urlParams.get('id');
        let roomId = urlParams.get('room');
        
        // If no ID in URL, create a new conference
        if (!confId) {
          try {
            // First check server connectivity
            const isConnected = await conferenceService.checkServerConnectivity();
            
            if (!isConnected) {
              throw new Error('Cannot connect to conference server. Please check your internet connection and try again.');
            }
            
            const response = await fetch('http://localhost:5001/api/conferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            confId = data.conferenceId;
            
            // Update URL with the new conference ID
            const newUrl = `${window.location.pathname}?id=${confId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          } catch (error) {
            console.error("Failed to create conference:", error);
            // Show error message to user
            setConnectionError(error instanceof Error ? error.message : "Failed to create conference");
            
            // If server is unavailable, create a temporary local ID
            confId = `local-${Date.now()}`;
            const newUrl = `${window.location.pathname}?id=${confId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }
        }
        
        if (roomId) {
          setCurrentRoomId(roomId);
        }
        
        setConferenceId(confId);
        
        // Connect to conference service
        const connectionSuccess = await conferenceService.connect();
        
        if (!connectionSuccess) {
          setConnectionError('Failed to connect to conference server. You are in offline mode.');
        }
        
        // Set up event listeners
        conferenceService.on('onConferenceJoined', handleConferenceJoined);
        conferenceService.on('onParticipantJoined', handleParticipantJoined);
        conferenceService.on('onParticipantLeft', handleParticipantLeft);
        conferenceService.on('onParticipantUpdated', handleParticipantUpdated);
        conferenceService.on('onMessageReceived', handleMessageReceived);
        conferenceService.on('onRemoteStreamAdded', handleRemoteStreamAdded);
        conferenceService.on('onRemoteStreamRemoved', handleRemoteStreamRemoved);
        conferenceService.on('onRoomJoined', handleRoomJoined);
        conferenceService.on('onUserJoinedRoom', handleUserJoinedRoom);
        conferenceService.on('onUserLeftRoom', handleUserLeftRoom);
        conferenceService.on('onRoomCreated', handleRoomCreated);
        conferenceService.on('onRoomRemoved', handleRoomRemoved);
        conferenceService.on('community-created', (community: CommunityInfo) => {
          setRoomCommunity(community);
        });
        conferenceService.on('onError', (error: Error) => {
          console.error("Conference service error:", error);
          setConnectionError(error.message || "Failed to connect to conference service");
        });
        conferenceService.on('onScreenShareStarted', (participantId: string) => {
          setParticipants(prev => 
            prev.map(p => p.id === participantId ? { ...p, isScreenSharing: true } : p)
          );
        });
        conferenceService.on('onScreenShareStopped', (participantId: string) => {
          setParticipants(prev => 
            prev.map(p => p.id === participantId ? { ...p, isScreenSharing: false } : p)
          );
        });
        conferenceService.on('onHostChanged', handleHostChange);
        
        try {
          // Join conference
          await conferenceService.joinConference(
            confId,
            {
              id: `user-${Date.now()}`,
              name: "Alex Johnson",
              avatar: avatarUrl
            },
            roomId,
            isVideoOn,
            isAudioOn
          );

          console.log(`Joined conference: ${confId}`);
        } catch (joinError) {
          console.error('Error joining conference:', joinError);
          setConnectionError(joinError instanceof Error ? joinError.message : "Failed to join conference");
        }
      } catch (error) {
        console.error('Error initializing conference:', error);
        setConnectionError(error instanceof Error ? error.message : "Failed to initialize conference");
      }
    };
    
    initConference();
    
    // Clean up when component unmounts
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      conferenceService.leaveConference();
      conferenceService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Scroll chat to bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Conference event handlers
  const handleConferenceJoined = (state: any) => {
    setParticipants(state.participants);
    setRooms(state.rooms || []);
    setCurrentRoomId(state.currentRoomId);
    setRoomParticipants(state.roomParticipants || []);
    
    // Convert message timestamps to Date objects
    const formattedMessages = state.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    setMessages(formattedMessages);

    // Update URL with room ID
    if (state.currentRoomId && state.currentRoomId !== 'main') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('room', state.currentRoomId);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };
  
  const handleParticipantJoined = (participant: ParticipantType) => {
    setParticipants(prev => [...prev, participant]);
  };
  
  const handleParticipantLeft = (participantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };
  
  const handleParticipantUpdated = (participantId: string, updates: any) => {
    setParticipants(prev => 
      prev.map(p => p.id === participantId ? { ...p, ...updates } : p)
    );
  };
  
  const handleMessageReceived = (message: MessageType) => {
    setMessages(prev => [...prev, message]);
  };
  
  const handleRemoteStreamAdded = (participantId: string, stream: MediaStream) => {
    // In a real implementation, you would attach this stream to the appropriate video element
    console.log(`Remote stream added for participant ${participantId}`);
  };
  
  const handleRemoteStreamRemoved = (participantId: string) => {
    // In a real implementation, you would remove the stream from the appropriate video element
    console.log(`Remote stream removed for participant ${participantId}`);
  };

  // Room event handlers
  const handleRoomJoined = (roomId: string, participants: ParticipantType[], messages: MessageType[]) => {
    setCurrentRoomId(roomId);
    setRoomParticipants(participants.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isVideoOn: p.isVideoOn,
      isAudioOn: p.isAudioOn,
      isScreenSharing: p.isScreenSharing,
      isHost: p.isHost
    })));
    
    // Update URL to include the room ID
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('room', roomId);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Reset the messages for the new room
    setMessages(messages.map(m => ({
      id: m.id,
      content: m.content,
      sender: m.sender,
      timestamp: new Date(m.timestamp)
    })));
    
    console.log(`Joined room: ${roomId} with ${participants.length} participants`);
    
    // Check if this room has an associated community
    checkRoomCommunity();
  };
  
  const handleUserJoinedRoom = (roomId: string, participant: ParticipantType) => {
    if (roomId === currentRoomId) {
      setRoomParticipants(prev => [...prev, participant]);
    }
  };
  
  const handleUserLeftRoom = (roomId: string, participantId: string) => {
    if (roomId === currentRoomId) {
      setRoomParticipants(prev => prev.filter(p => p.id !== participantId));
    }
  };
  
  const handleRoomCreated = (room: RoomType) => {
    setRooms(prev => [...prev, room]);
  };
  
  const handleRoomRemoved = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Send message to current room
    conferenceService.sendMessage(newMessage);
    
    setNewMessage("");
  };
  
  const handleChangeRoom = (roomId: string) => {
    conferenceService.changeRoom(roomId);
  };
  
  const handleCreateRoom = async () => {
    // Reset error
    setRoomCreationError(null);
    
    if (!newRoomName.trim()) {
      setRoomCreationError("Please enter a room name");
      return;
    }
    
    // Check if conference is connected using the service method
    if (!conferenceService.isConnectedToConference()) {
      setRoomCreationError("Cannot create room: Not connected to a conference");
      return;
    }
    
    try {
      // Show loading indicator
      const button = document.querySelector('[data-create-room-button]');
      if (button) button.textContent = "Creating...";
      
      // Create room with additional parameters
      const room = await conferenceService.createRoom({
        name: newRoomName.trim(),
        isPrivate: roomPrivacy === 'private',
        template: roomTemplate,
        description: roomDescription,
        capacity: roomCapacity
      });
      
      console.log("Room created successfully:", room);
      
      setShowCreateRoomDialog(false);
      resetRoomForm();
      
      // Automatically join the newly created room
      handleChangeRoom(room.id);
    } catch (error) {
      console.error('Error creating room:', error);
      setRoomCreationError(error instanceof Error ? error.message : "Failed to create room");
    } finally {
      // Reset button text
      const button = document.querySelector('[data-create-room-button]');
      if (button) button.textContent = "Create Room";
    }
  };

  const handleMediaToggle = (type: 'video' | 'audio') => {
    if (type === 'video') {
      const newState = !isVideoOn;
      setIsVideoOn(newState);
      conferenceService.updateMedia({ isVideoOn: newState });
    } else {
      const newState = !isAudioOn;
      setIsAudioOn(newState);
      conferenceService.updateMedia({ isAudioOn: newState });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploadingMedia(true);
      
      const file = files[0];
      const uploadResponse = await cloudinaryService.uploadFromBlob(file, {
        folder: `forumx-conference/${conferenceId}/chat`
      });
      
      // Send message with image
      const imageMessage = `<img src="${uploadResponse.secureUrl}" alt="Shared image" />`;
      conferenceService.sendMessage(imageMessage);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingMedia(false);
    }
  };

  const captureAndUploadSnapshot = async () => {
    if (!videoRef.current || !localStreamRef.current) return;
    
    try {
      setUploadingMedia(true);
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw the video frame to the canvas
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg');
      
      // Upload to Cloudinary
      const uploadResponse = await cloudinaryService.uploadFromBase64(base64Image, {
        folder: `forumx-conference/${conferenceId}/snapshots`,
        resourceType: 'image'
      });
      
      // Send message with the snapshot
      const imageMessage = `<img src="${uploadResponse.secureUrl}" alt="Camera snapshot" />`;
      conferenceService.sendMessage(imageMessage);
    } catch (error) {
      console.error("Error capturing and uploading snapshot:", error);
    } finally {
      setUploadingMedia(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Stopping the recording is handled by the cloudinaryService after the duration
    } else {
      if (!localStreamRef.current) return;
      
      try {
        setIsRecording(true);
        setUploadingMedia(true);
        
        // Start recording and upload to Cloudinary (30 second clip)
        const uploadResponse = await cloudinaryService.uploadMediaRecording(
          localStreamRef.current,
          30000, // 30 seconds
          {
            folder: `forumx-conference/${conferenceId}/recordings`,
            resourceType: 'video'
          }
        );
        
        // Send message with the recording
        const videoMessage = `<video controls src="${uploadResponse.secureUrl}" type="video/mp4"></video>`;
        conferenceService.sendMessage(videoMessage);
      } catch (error) {
        console.error("Error recording and uploading video:", error);
      } finally {
        setIsRecording(false);
        setUploadingMedia(false);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render functions for message content (to handle HTML)
  const renderMessageContent = (content: string, message: Message) => {
    const isMedia = content.includes('<img') || content.includes('<video');
    
    return (
      <div className="space-y-2">
        {isMedia ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-sm mt-1">{content}</p>
        )}
        
        <div className="flex items-center space-x-3 mt-2">
          <button 
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
            onClick={() => handleUpvote(message.id)}
          >
            <ArrowUp size={14} /> Upvote
          </button>
          <button 
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-destructive"
            onClick={() => handleDownvote(message.id)}
          >
            <ArrowDown size={14} /> Downvote
          </button>
          <button 
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => handleCommentClick(message.id)}
          >
            <MessageSquare size={14} /> Comment
          </button>
          <button 
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => handleShare(message.id)}
          >
            <Share2 size={14} /> Share
          </button>
          <button 
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => handleSave(message.id)}
          >
            <BookmarkPlus size={14} /> Save
          </button>
        </div>
      </div>
    );
  };

  const handleUpvote = async (messageId: string) => {
    try {
      // Get current user
      const userId = `user-${Date.now()}`; // This would be the actual user ID in a real app
      
      await interactionsService.addUpvote(userId, messageId, 'message' as ItemType);
      
      // In a real app, you would update the UI to show that this message was upvoted
      console.log(`Message ${messageId} upvoted`);
    } catch (error) {
      console.error("Error upvoting message:", error);
    }
  };

  const handleDownvote = async (messageId: string) => {
    try {
      // Get current user
      const userId = `user-${Date.now()}`; // This would be the actual user ID in a real app
      
      await interactionsService.addDownvote(userId, messageId, 'message' as ItemType);
      
      // In a real app, you would update the UI to show that this message was downvoted
      console.log(`Message ${messageId} downvoted`);
    } catch (error) {
      console.error("Error downvoting message:", error);
    }
  };

  const handleCommentClick = (messageId: string) => {
    setCommentMessageId(messageId);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentMessageId || !commentText.trim()) return;
    
    try {
      // Get current user
      const userId = `user-${Date.now()}`; // This would be the actual user ID in a real app
      const userName = "Alex Johnson";
      const userAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&auto=format&fit=crop";
      
      await interactionsService.addComment(
        userId,
        commentMessageId,
        'message' as ItemType,
        commentText,
        userName,
        userAvatar
      );
      
      // Reset comment state
      setCommentText("");
      setCommentMessageId(null);
      
      // In a real app, you would update the UI to show the new comment
      console.log(`Comment added to message ${commentMessageId}`);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleShare = async (messageId: string) => {
    try {
      // Get current user
      const userId = `user-${Date.now()}`; // This would be the actual user ID in a real app
      
      // Generate share URL for this message
      const shareUrl = `${window.location.origin}/conference?id=${conferenceId}&message=${messageId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Record the share
      await interactionsService.shareItem(
        userId,
        messageId,
        'message' as ItemType,
        'clipboard'
      );
      
      // Show success message (in a real app this would be a toast notification)
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing message:", error);
    }
  };

  const handleSave = async (messageId: string) => {
    try {
      // Get current user
      const userId = `user-${Date.now()}`; // This would be the actual user ID in a real app
      
      await interactionsService.saveItem(
        userId,
        messageId,
        'message' as ItemType
      );
      
      // In a real app, you would update the UI to show that this message was saved
      console.log(`Message ${messageId} saved`);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // Check if current room has a community
  const checkRoomCommunity = async () => {
    if (!currentRoomId) return;
    
    setIsCheckingCommunity(true);
    try {
      // First check if a community exists
      const checkResult = await conferenceService.checkRoomCommunity();
      
      if (checkResult.hasCommunity) {
        // Get community details
        const community = await conferenceService.getRoomCommunity();
        setRoomCommunity(community);
      } else {
        setRoomCommunity(null);
      }
    } catch (error) {
      console.error("Error checking room community:", error);
    } finally {
      setIsCheckingCommunity(false);
    }
  };

  // Check for community when room changes
  useEffect(() => {
    if (currentRoomId) {
      checkRoomCommunity();
    }
  }, [currentRoomId]);

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || !communityDescription.trim()) {
      alert("Name and description are required");
      return;
    }
    
    try {
      const communityData = {
        name: communityName,
        description: communityDescription,
        tags: communityTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPrivate: isPrivateCommunity
      };
      
      const community = await conferenceService.createCommunityFromRoom(communityData);
      
      if (community) {
        setRoomCommunity(community);
        setShowCreateCommunityDialog(false);
        resetCommunityForm();
      }
    } catch (error) {
      console.error("Error creating community:", error);
      alert("Failed to create community. You might need to sign in.");
    }
  };
  
  const resetCommunityForm = () => {
    setCommunityName("");
    setCommunityDescription("");
    setCommunityTags("");
    setIsPrivateCommunity(false);
  };
  
  const navigateToCommunity = () => {
    if (roomCommunity) {
      window.open(`/community/${roomCommunity.id}`, '_blank');
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        await conferenceService.startScreenShare();
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        conferenceService.stopScreenShare();
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      setIsScreenSharing(false);
    }
  };
  
  const handleHostChange = (newHostId: string) => {
    // Update participant list to reflect new host
    setParticipants(prev => 
      prev.map(p => ({ ...p, isHost: p.id === newHostId }))
    );
    
    // Update room participants if applicable
    setRoomParticipants(prev => 
      prev.map(p => ({ ...p, isHost: p.id === newHostId }))
    );
  };
  
  // Add a handler for leaving just the current room
  const handleLeaveRoom = () => {
    // Only perform this action if not in the main room
    if (currentRoomId !== 'main') {
      conferenceService.leaveRoom();
      
      // No need to update state here as the room-joined event will be triggered
      // which will update the UI appropriately
      console.log(`Leaving room: ${currentRoomId}`);
    }
  };
  
  const handleLeaveConference = () => {
    // Leave the conference and redirect to home or another page
    conferenceService.leaveConference();
    conferenceService.disconnect();
    
    // Clear local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Redirect to home page or another page
    window.location.href = '/';
  };

  // Add a function to reset room form
  const resetRoomForm = () => {
    setNewRoomName('');
    setRoomPrivacy('public');
    setRoomTemplate('standard');
    setRoomDescription('');
    setRoomCapacity(10);
  };

  // Add function to handle Enter key in room name input
  const handleRoomNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newRoomName.trim()) {
      e.preventDefault();
      handleCreateRoom();
    }
  };

  // Add function to handle inviting users
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Reset states
    setInviteError(null);
    setInviteSuccess(null);
    
    if (!inviteEmail.trim()) {
      setInviteError("Please enter an email address");
      return;
    }
    
    if (!emailRegex.test(inviteEmail)) {
      setInviteError("Please enter a valid email address");
      return;
    }
    
    try {
      setIsInviting(true);
      
      // Add email to the list
      setInviteEmails([...inviteEmails, inviteEmail]);
      
      // Create invitation link with conference and room IDs
      const inviteLink = `${window.location.origin}/conference?id=${conferenceId}&room=${currentRoomId}`;
      
      // In a real app, you would send this via your backend API
      // For example:
      // await fetch('/api/send-invitation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: inviteEmail, link: inviteLink })
      // });
      
      console.log(`Invitation link for ${inviteEmail}: ${inviteLink}`);
      
      // Show success message
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      
      // Clear input
      setInviteEmail("");
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  // Add function to handle copying invitation link
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/conference?id=${conferenceId}&room=${currentRoomId}`;
    
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setInviteSuccess("Link copied to clipboard!");
        setTimeout(() => setInviteSuccess(null), 3000);
      })
      .catch(() => {
        setInviteError("Failed to copy link");
        setTimeout(() => setInviteError(null), 3000);
      });
  };

  // Add function to remove an invited email
  const handleRemoveInvitedEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  // Add handler for avatar change
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsChangingAvatar(true);
      const file = files[0];
      
      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadFromBase64(
        base64 as string,
        {
          folder: 'avatar'
        }
      );
      
      if (uploadResult?.secureUrl) {
        setAvatarUrl(uploadResult.secureUrl);
        
        // Update participant info
        const updates = { avatar: uploadResult.secureUrl };
        conferenceService.updateParticipantInfo(updates);
        
        setShowAvatarDialog(false);
      }
    } catch (error) {
      console.error("Error changing avatar:", error);
    } finally {
      setIsChangingAvatar(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    // Check connection status periodically
    const checkConnection = () => {
      const connected = conferenceService.isConnectedToConference();
      setIsConnected(connected);
    };
    
    // Check immediately
    checkConnection();
    
    // Then check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Add function to reconnect to conference
  const handleReconnect = async () => {
    setConnectionError("Attempting to reconnect...");
    
    try {
      // First try normal reconnect
      let success = await conferenceService.reconnect();
      
      // If normal reconnect fails, try hard reset
      if (!success) {
        console.log("Normal reconnect failed, attempting hard reset...");
        setConnectionError("Normal reconnection failed. Attempting hard reset...");
        
        success = await conferenceService.hardReset();
      }
      
      if (success) {
        setConnectionError(null);
        
        // Re-join the conference
        await conferenceService.joinConference(
          conferenceId,
          {
            id: `user-${Date.now()}`,
            name: "Alex Johnson",
            avatar: avatarUrl
          },
          currentRoomId,
          isVideoOn,
          isAudioOn
        );
        
        console.log("Successfully reconnected to conference");
      } else {
        setConnectionError("Failed to reconnect. Please refresh the page and try again.");
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
      setConnectionError(error instanceof Error ? error.message : "Failed to reconnect");
    }
  };
  
  // Add function for hard reset (completely resets connection)
  const handleHardReset = async () => {
    setConnectionError("Performing hard reset of connection...");
    
    try {
      const success = await conferenceService.hardReset();
      
      if (success) {
        setConnectionError(null);
        
        // Re-join the conference
        await conferenceService.joinConference(
          conferenceId,
          {
            id: `user-${Date.now()}`,
            name: "Alex Johnson",
            avatar: avatarUrl
          },
          currentRoomId,
          isVideoOn,
          isAudioOn
        );
        
        console.log("Successfully reconnected after hard reset");
      } else {
        setConnectionError("Hard reset failed. Please refresh the page.");
      }
    } catch (error) {
      console.error("Error during hard reset:", error);
      setConnectionError(error instanceof Error ? error.message : "Hard reset failed");
    }
  };

  useEffect(() => {
    // Access user media and store it in localStreamRef
    const getMediaStream = async () => {
      try {
        if (isVideoOn || isAudioOn) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: isVideoOn,
            audio: isAudioOn
          });
          
          localStreamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else if (localStreamRef.current) {
          // Stop all tracks if both video and audio are off
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
          
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setIsVideoOn(false);
        setIsAudioOn(false);
      }
    };
    
    getMediaStream();
  }, [isVideoOn, isAudioOn]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 p-2 md:p-4">
          {/* Connection error alert */}
          {connectionError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4 mt-4 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-red-800 font-medium">{connectionError}</p>
                  <p className="text-red-600 text-sm">You are currently in offline mode. Some features may be limited.</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleReconnect} variant="secondary" size="sm" className="whitespace-nowrap">
                  <RefreshCw className="h-4 w-4 mr-2" /> Reconnect
                </Button>
                <Button onClick={handleHardReset} variant="outline" size="sm" className="whitespace-nowrap">
                  Hard Reset
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-theme(spacing.16))]">
            {/* Video Display - Now takes 8 columns in large screens */}
            <div className="lg:col-span-8 bg-card rounded-lg shadow-md p-4 h-full order-2 lg:order-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {rooms.find(r => r.id === currentRoomId)?.name || 'Conference'} 
                </h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleMediaToggle('video')}>
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMediaToggle('audio')}>
                    {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleScreenShare}
                    className={isScreenSharing ? "bg-primary/10" : ""}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={captureAndUploadSnapshot}
                    disabled={!isVideoOn || uploadingMedia}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAvatarDialog(true)}
                  >
                    <UserCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isRecording ? "default" : "outline"}
                    size="sm" 
                    onClick={toggleRecording}
                    disabled={!isVideoOn || uploadingMedia}
                    className={isRecording ? "bg-red-500 text-white" : ""}
                  >
                    <Settings className={`h-4 w-4 ${isRecording ? "animate-spin" : ""}`} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleLeaveConference}>
                    <PhoneOff className="h-4 w-4 mr-1" /> Leave Conference
                  </Button>
                </div>
              </div>
              
              {/* Render video grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-[calc(100%-4rem)]">
                {/* Local Video */}
                <div className="relative rounded-md overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOn ? 'block' : 'hidden'}`}
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent">
                      <Avatar className="h-16 w-16 mb-2">
                        <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&auto=format&fit=crop" alt="You" />
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">You</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex space-x-1">
                    {!isAudioOn && <MicOff className="h-4 w-4 text-red-500 bg-background/80 p-0.5 rounded-full" />}
                    {!isVideoOn && <VideoOff className="h-4 w-4 text-red-500 bg-background/80 p-0.5 rounded-full" />}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-0.5 rounded text-xs">
                    You
                  </div>
                </div>
                
                {/* Remote Participants */}
                {roomParticipants.filter(p => p.id !== 'user-12345').map((participant) => (
                  <div key={participant.id} className="relative rounded-md overflow-hidden bg-black">
                    <video
                      id={`video-${participant.id}`}
                      autoPlay
                      playsInline
                      className={`w-full h-full object-cover ${participant.isVideoOn ? 'block' : 'hidden'}`}
                    />
                    {!participant.isVideoOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent">
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={participant.avatar} alt={participant.name} />
                          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{participant.name}</p>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex space-x-1">
                      {!participant.isAudioOn && <MicOff className="h-4 w-4 text-red-500 bg-background/80 p-0.5 rounded-full" />}
                      {!participant.isVideoOn && <VideoOff className="h-4 w-4 text-red-500 bg-background/80 p-0.5 rounded-full" />}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-0.5 rounded text-xs">
                      {participant.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Rooms and Conference Controls - Now takes 4 columns in large screens */}
            <div className="flex flex-col h-full lg:col-span-4 order-1 lg:order-2">
              {/* Conference Rooms Panel */}
              <div className="bg-card rounded-lg shadow-md p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold flex items-center">
                    <DoorOpen className="mr-2 h-5 w-5" />
                    Conference Rooms
                  </h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowCreateRoomDialog(true)}
                  >
                    <PlusCircle className="mr-1 h-4 w-4" /> New Room
                  </Button>
                </div>
                
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {rooms.map(room => (
                      <div 
                        key={room.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${currentRoomId === room.id ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
                        onClick={() => handleChangeRoom(room.id)}
                      >
                        <div className="flex items-center">
                          {room.id === 'main' ? (
                            <Home className="mr-2 h-4 w-4" />
                          ) : (
                            <DoorOpen className="mr-2 h-4 w-4" />
                          )}
                          <span className="font-medium">{room.name}</span>
                          {currentRoomId === room.id && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Current</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Users2 className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{room.participantCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Current Room Info */}
                {currentRoomId && (
                  <div className="mt-3 p-2 bg-accent/50 rounded-md">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Currently in: {rooms.find(r => r.id === currentRoomId)?.name || currentRoomId}</h4>
                      <div className="flex space-x-1">
                        {currentRoomId !== 'main' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleLeaveRoom} 
                            className="text-xs"
                          >
                            <LogOut className="h-3 w-3 mr-1" /> Leave Room
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowInviteDialog(true)} 
                          className="text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" /> Invite
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <Users2 className="mr-1 h-3 w-3" />
                      <span>{roomParticipants.length} participants</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat and Participants Panel */}
              <div className="bg-card rounded-lg shadow-md p-4 flex-1">
                <Tabs defaultValue="chat">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="chat" className="flex-1">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="flex-1">
                      <Users className="mr-2 h-4 w-4" />
                      Participants
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chat" className="h-[calc(100%-3rem)]">
                    <div className="flex flex-col h-full">
                      <ScrollArea ref={scrollRef} className="flex-1 pr-2">
                        <div className="space-y-3">
                          {messages.map(message => (
                            <div key={message.id} className="flex flex-col">
                              <div className="flex items-start">
                                <Avatar className="mt-0.5 mr-2">
                                  <AvatarImage src={message.sender.avatar} />
                                  <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{message.sender.name}</div>
                                    <div className="text-xs text-gray-500">{formatTime(message.timestamp)}</div>
                                  </div>
                                  <div className="mt-1 break-words">
                                    {renderMessageContent(message.content, message)}
                                  </div>
                                  <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                    <button 
                                      className="flex items-center hover:text-primary"
                                      onClick={() => handleUpvote(message.id)}
                                    >
                                      <ArrowUp size={12} className="mr-1" />
                                      <span>Upvote</span>
                                    </button>
                                    <button 
                                      className="flex items-center hover:text-primary"
                                      onClick={() => handleDownvote(message.id)}
                                    >
                                      <ArrowDown size={12} className="mr-1" />
                                      <span>Downvote</span>
                                    </button>
                                    <button 
                                      className="flex items-center hover:text-primary"
                                      onClick={() => handleCommentClick(message.id)}
                                    >
                                      <MessageSquare size={12} className="mr-1" />
                                      <span>Comment</span>
                                    </button>
                                    <button 
                                      className="flex items-center hover:text-primary"
                                      onClick={() => handleShare(message.id)}
                                    >
                                      <Share2 size={12} className="mr-1" />
                                      <span>Share</span>
                                    </button>
                                    <button 
                                      className="flex items-center hover:text-primary"
                                      onClick={() => handleSave(message.id)}
                                    >
                                      <BookmarkPlus size={12} className="mr-1" />
                                      <span>Save</span>
                                    </button>
                                  </div>
                                  
                                  {commentMessageId === message.id && (
                                    <form onSubmit={handleCommentSubmit} className="mt-2">
                                      <Textarea
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className="min-h-[60px] text-sm"
                                      />
                                      <div className="flex justify-end mt-2 space-x-2">
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => {
                                            setCommentMessageId(null);
                                            setCommentText("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button type="submit" size="sm">Comment</Button>
                                      </div>
                                    </form>
                                  )}
                                </div>
                              </div>
                              <Separator className="my-4" />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="mt-3">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                          <Input
                            className="flex-1"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            title="Upload image"
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                            <Image className="h-4 w-4" />
                          </Button>
                          <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="participants" className="h-[calc(100%-3rem)]">
                    <ScrollArea className="h-full">
                      <div className="space-y-3">
                        {roomParticipants.map(participant => (
                          <div key={participant.id} className="flex items-center p-2 hover:bg-accent/50 rounded-md">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-background">
                                <AvatarImage src={participant.avatar} alt={participant.name} />
                                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {participant.isHost && (
                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  <Crown className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium">{participant.name}</p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                {participant.isVideoOn ? 
                                  <Video className="h-3 w-3 mr-1 text-green-500" /> : 
                                  <VideoOff className="h-3 w-3 mr-1 text-red-500" />
                                }
                                {participant.isAudioOn ? 
                                  <Mic className="h-3 w-3 text-green-500" /> : 
                                  <MicOff className="h-3 w-3 text-red-500" />
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Create Room Dialog */}
      <Dialog open={showCreateRoomDialog} onOpenChange={setShowCreateRoomDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>
              Create a custom room for your conference needs
            </DialogDescription>
          </DialogHeader>
          
          {/* Connection status indicator */}
          <div className={`flex items-center gap-2 p-2 rounded-md ${isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-sm">
              {isConnected ? 'Connected to conference' : 'Not connected to conference'}
            </span>
          </div>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="roomName">Room Name*</Label>
              <Input 
                id="roomName" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={handleRoomNameKeyDown}
                placeholder="Enter a room name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="roomDescription">Description</Label>
              <Textarea
                id="roomDescription"
                placeholder="Room description (optional)"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="roomTemplate">Room Template</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roomTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`border rounded-md p-2 cursor-pointer transition-colors ${
                      roomTemplate === template.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                    }`}
                    onClick={() => setRoomTemplate(template.id)}
                  >
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="roomPrivacy">Room Privacy</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={roomPrivacy === 'public' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoomPrivacy('public')}
                  className="flex-1"
                >
                  <Globe className="h-4 w-4 mr-2" /> Public
                </Button>
                <Button
                  type="button"
                  variant={roomPrivacy === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoomPrivacy('private')}
                  className="flex-1"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Private
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {roomPrivacy === 'public' 
                  ? 'Anyone can join this room'
                  : 'Only people with the direct link can join'}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="roomCapacity">Max Participants <span className="text-xs text-muted-foreground">({roomCapacity})</span></Label>
              <Input
                id="roomCapacity"
                type="range"
                min="2"
                max="50"
                value={roomCapacity}
                onChange={e => setRoomCapacity(parseInt(e.target.value))}
                className="cursor-pointer"
              />
            </div>
            
            {roomCreationError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{roomCreationError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreateRoomDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoom}
              disabled={!isConnected || !newRoomName.trim()}
              data-create-room-button
            >
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Community Dialog */}
      <Dialog open={showCreateCommunityDialog} onOpenChange={setShowCreateCommunityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Community from Room</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="communityName" className="text-sm font-medium block mb-1">Community Name</label>
                <Input
                  id="communityName"
                  placeholder="Enter community name"
                  value={communityName}
                  onChange={e => setCommunityName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="communityDescription" className="text-sm font-medium block mb-1">Description</label>
                <Textarea
                  id="communityDescription"
                  placeholder="Describe your community"
                  value={communityDescription}
                  onChange={e => setCommunityDescription(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="communityTags" className="text-sm font-medium block mb-1">Tags (comma separated)</label>
                <Input
                  id="communityTags"
                  placeholder="technology, programming, etc."
                  value={communityTags}
                  onChange={e => setCommunityTags(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="privateCheckbox"
                  checked={isPrivateCommunity}
                  onChange={e => setIsPrivateCommunity(e.target.checked)}
                />
                <label htmlFor="privateCheckbox" className="text-sm">Make this community private</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCommunityDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCommunity}>Create Community</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Invitation Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite to Room</DialogTitle>
            <DialogDescription>
              Send invitations to join "{rooms.find(r => r.id === currentRoomId)?.name || 'this room'}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteUser}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="inviteEmail" className="text-sm font-medium">Email address</label>
                <div className="flex space-x-2">
                  <Input
                    id="inviteEmail"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Inviting
                      </span>
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              </div>
              
              {inviteError && (
                <div className="text-sm text-red-500">{inviteError}</div>
              )}
              
              {inviteSuccess && (
                <div className="text-sm text-green-500">{inviteSuccess}</div>
              )}
              
              {inviteEmails.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invited users</label>
                  <div className="space-y-1">
                    {inviteEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between p-2 bg-accent/50 rounded-md">
                        <span className="text-sm">{email}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleRemoveInvitedEmail(email)}
                          className="h-6 w-6 p-0"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Or share invitation link</label>
                  <div className="flex space-x-2">
                    <Input 
                      value={`${window.location.origin}/conference?id=${conferenceId}&room=${currentRoomId}`}
                      readOnly
                      className="flex-1 bg-accent/10"
                    />
                    <Button type="button" onClick={handleCopyInviteLink}>
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Avatar Change Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Avatar</DialogTitle>
            <DialogDescription>
              Upload a new profile picture for this conference.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload avatar image"
              title="Choose an avatar image"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isChangingAvatar}
            >
              {isChangingAvatar ? "Uploading..." : "Choose Image"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvatarDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Conference; 
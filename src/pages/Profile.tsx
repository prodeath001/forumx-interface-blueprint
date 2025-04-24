import React from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import PostList from "@/components/feed/PostList";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Mail, MapPin } from "lucide-react";

const Profile = () => {
  const { username } = useParams();
  
  // Mock user data (in a real app, this would come from an API)
  const userData = {
    username: username || "TechEnthusiast",
    displayName: "Alex Johnson",
    bio: "Software engineer passionate about web development and open source. Working on interesting projects and sharing knowledge with the community.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&auto=format&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=300&auto=format&fit=crop",
    joined: "January 2021",
    location: "San Francisco, CA",
    email: "alex@example.com",
    stats: {
      posts: 127,
      comments: 483,
      karma: 8456
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="pt-14 flex">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <main className="flex-1 sm:ml-56 lg:mr-72">
          <div className="max-w-3xl mx-auto">
            {/* Cover Image */}
            <div className="h-48 overflow-hidden rounded-b-lg">
              <img 
                src={userData.coverImage} 
                alt="Cover" 
                className="w-full object-cover"
              />
            </div>
            
            {/* Profile Header */}
            <div className="bg-white px-6 py-4 shadow rounded-lg -mt-6 mb-4 relative mx-4">
              {/* Avatar */}
              <div className="absolute -top-16 left-6 border-4 border-white rounded-full">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback>{userData.displayName.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </div>
              
              {/* User Info */}
              <div className="ml-28 pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold">{userData.displayName}</h1>
                    <p className="text-muted-foreground">u/{userData.username}</p>
                  </div>
                  <Button>Follow</Button>
                </div>
                
                {/* Bio */}
                <p className="mt-2 text-sm">{userData.bio}</p>
                
                {/* Additional Info */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Joined {userData.joined}</span>
                  </div>
                  {userData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{userData.location}</span>
                    </div>
                  )}
                  {userData.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={16} />
                      <span>{userData.email}</span>
                    </div>
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex gap-4 mt-4">
                  <div className="text-center">
                    <p className="font-bold">{userData.stats.posts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{userData.stats.comments}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{userData.stats.karma}</p>
                    <p className="text-xs text-muted-foreground">Karma</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="px-4">
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                  <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
                  <TabsTrigger value="upvoted" className="flex-1">Upvoted</TabsTrigger>
                  <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="mt-4">
                  <PostList />
                </TabsContent>
                
                <TabsContent value="comments" className="mt-4">
                  <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-muted-foreground">Comments will appear here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="upvoted" className="mt-4">
                  <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-muted-foreground">Upvoted content will appear here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="saved" className="mt-4">
                  <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-muted-foreground">Saved content will appear here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default Profile; 
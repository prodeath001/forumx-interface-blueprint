import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import PostList from "@/components/feed/PostList";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Mail, MapPin } from "lucide-react";
import userService, { UserProfile } from "@/lib/userService";
import { Skeleton } from "@/components/ui/skeleton";
import interactionsService, { Save } from "@/lib/interactionsService";
import authService from "@/lib/authService";

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  
  const [savedItems, setSavedItems] = useState<Save[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const currentUser = authService.getUser();
  const isCurrentUserProfile = currentUser?.username === username;

  const defaultCoverImage = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=300&auto=format&fit=crop";
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserByUsername(username);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  useEffect(() => {
    const fetchTabData = async () => {
      if (!userData?._id) return;

      if (activeTab === "saved" && isCurrentUserProfile) {
        setLoadingSaved(true);
        try {
          const saves = await interactionsService.getUserSaves(userData._id);
          setSavedItems(saves);
        } catch (err) {
          console.error("Error fetching saved items:", err);
        } finally {
          setLoadingSaved(false);
        }
      } else if (activeTab === "posts") {
        // TODO: Fetch user posts when endpoint exists
        // Example: fetchUserPosts(userData._id)
      } else if (activeTab === "comments") {
        // TODO: Fetch user comments when endpoint exists
        // Example: fetchUserComments(userData._id)
      } else if (activeTab === "upvoted") {
        // TODO: Fetch user upvoted items when endpoint exists
        // Example: fetchUserUpvoted(userData._id)
      }
    };

    fetchTabData();
  }, [activeTab, userData?._id, isCurrentUserProfile]);

  if (error) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navbar />
        <div className="pt-14 flex">
          <LeftSidebar />
          <main className="flex-1 sm:ml-56 lg:mr-72">
            <div className="max-w-3xl mx-auto p-4">
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-red-500">Error: {error}</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />

      <div className="pt-14 flex">
        <LeftSidebar />

        <main className="flex-1 sm:ml-56 lg:mr-72">
          <div className="max-w-3xl mx-auto">
            <div className="h-48 overflow-hidden rounded-b-lg">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <img 
                  src={userData?.coverImage || defaultCoverImage} 
                  alt="Cover" 
                  className="w-full object-cover"
                />
              )}
            </div>
            
            <div className="bg-white px-6 py-4 shadow rounded-lg -mt-6 mb-4 relative mx-4">
              <div className="absolute -top-16 left-6 border-4 border-white rounded-full">
                {loading ? (
                  <Skeleton className="h-24 w-24 rounded-full" />
                ) : (
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData?.avatar} />
                    <AvatarFallback>{userData?.displayName?.slice(0, 2) || '??'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              
              <div className="ml-28 pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    {loading ? (
                      <>
                        <Skeleton className="h-8 w-48 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold">{userData?.displayName}</h1>
                        <p className="text-muted-foreground">u/{userData?.username}</p>
                      </>
                    )}
                  </div>
                  <Button>Follow</Button>
                </div>
                
                {loading ? (
                  <Skeleton className="h-12 w-full mt-2" />
                ) : (
                  <p className="mt-2 text-sm">{userData?.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {loading ? (
                    <>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Joined {userData?.joinedDate}</span>
                      </div>
                      {userData?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{userData.location}</span>
                        </div>
                      )}
                      {userData?.email && (
                        <div className="flex items-center gap-1">
                          <Mail size={16} />
                          <span>{userData.email}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex gap-4 mt-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-12 w-16" />
                      <Skeleton className="h-12 w-16" />
                      <Skeleton className="h-12 w-16" />
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="font-bold">{userData?.stats?.posts || 0}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{userData?.stats?.comments || 0}</p>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{userData?.stats?.karma || 0}</p>
                        <p className="text-xs text-muted-foreground">Karma</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-4">
              <Tabs 
                defaultValue="posts" 
                className="w-full" 
                onValueChange={(value) => setActiveTab(value)}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                  <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
                  <TabsTrigger value="upvoted" className="flex-1">Upvoted</TabsTrigger>
                  {isCurrentUserProfile && (
                    <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="posts" className="mt-4">
                  <PostList />
                </TabsContent>
                
                <TabsContent value="comments" className="mt-4">
                  <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-muted-foreground">User comments will appear here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="upvoted" className="mt-4">
                  <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-muted-foreground">User upvoted content will appear here</p>
                  </div>
                </TabsContent>
                
                {isCurrentUserProfile && (
                  <TabsContent value="saved" className="mt-4">
                    {loadingSaved ? (
                      <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p>Loading saved items...</p>
                      </div>
                    ) : savedItems.length > 0 ? (
                      <div className="bg-white p-4 rounded-lg shadow space-y-4">
                        {savedItems.map((item) => (
                          <div key={item.id} className="border-b pb-2">
                            <p className="text-sm">Saved Item ID: {item.itemId}</p>
                            <p className="text-xs text-muted-foreground">Type: {item.itemType}, Saved on: {new Date(item.timestamp).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p className="text-muted-foreground">You haven't saved any content yet</p>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
};

export default Profile; 
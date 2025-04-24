import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, Plus, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import authService from "@/lib/authService";
import { Skeleton } from "@/components/ui/skeleton";
import communityService, { CommunitySummary } from "@/lib/communityService";
import { formatMembers } from "@/lib/utils";

const UserProfileSummary = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = authService.getUser();
        if (user) {
          setUserData(user);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (!userData && !loading) {
    return null; // Don't show anything if not logged in
  }

  const handleViewProfile = () => {
    if (userData) {
      navigate(`/user/${userData.username}`);
    }
  };

  return (
    <div className="flex items-center space-x-3 mb-2">
      {loading ? (
        <>
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </>
      ) : (
        <>
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.avatar} />
            <AvatarFallback>{userData?.displayName?.substring(0, 2) || userData?.username?.substring(0, 2) || "FX"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{userData?.displayName || userData?.username}</p>
            <p className="text-xs text-muted-foreground">Karma: {userData?.stats?.karma || 0}</p>
          </div>
        </>
      )}
    </div>
  );
};

const CommunityItem = ({ name, members, icon }: { name: string; members: string; icon?: string }) => {
  const initials = name.substring(0, 2).toUpperCase();
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs overflow-hidden">
          {icon ? <img src={icon} alt={name} className="w-full h-full object-cover" /> : initials}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{members} members</p>
        </div>
      </div>
      <Button variant="outline" size="sm">Join</Button>
    </div>
  );
};

const RightSidebar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());

    const fetchCommunities = async () => {
      setLoadingCommunities(true);
      try {
        const fetchedCommunities = await communityService.getCommunities("growing", 5);
        setCommunities(fetchedCommunities);
      } catch (error) {
        console.error("Error fetching communities:", error);
        // Optionally set an error state to display message
      } finally {
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, []);

  return (
    <aside className="hidden lg:block fixed top-14 right-0 bottom-0 w-72 p-4 overflow-auto">
      <div className="space-y-4">
        {/* User Profile Card */}
        {isLoggedIn && (
          <Card>
            <CardContent className="pt-4">
              <UserProfileSummary />
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => navigate(`/user/${authService.getUser()?.username}`)}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Post Card */}
        <Card>
          <CardContent className="pt-4">
            <Button 
              className="w-full flex items-center gap-1 mb-2"
              onClick={() => {
                if (isLoggedIn) {
                  navigate('/create-post');
                } else {
                  navigate('/login?redirect=/create-post');
                }
              }}
            >
              <Plus size={16} /> Create Post
            </Button>
            <Link to={isLoggedIn ? "/create-community" : "/login?redirect=/create-community"}>
              <Button variant="outline" className="w-full flex items-center gap-1">
                <Users size={16} /> Create Community
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Communities Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <ArrowUp size={16} className="text-green-500" /> 
              Today's Top Growing Communities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingCommunities ? (
              <div className="space-y-3 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : communities.length > 0 ? (
              communities.map((community, index) => (
                <React.Fragment key={community.id}>
                  {index > 0 && <Separator className="my-2" />}
                  <CommunityItem 
                    name={community.name} 
                    members={formatMembers(community.memberCount)} 
                    icon={community.icon} 
                  />
                </React.Fragment>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No communities found.</p>
            )}
          </CardContent>
        </Card>

        {/* Sponsored Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">SPONSORED</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&h=200&auto=format&fit=crop" 
                alt="Advertisement" 
                className="w-full h-32 object-cover"
              />
              <p className="text-sm font-medium mt-2">Upgrade your productivity today</p>
              <p className="text-xs text-muted-foreground">Learn how our tools can transform your workflow</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};

export default RightSidebar;

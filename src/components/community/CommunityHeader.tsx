
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CommunityHeaderProps = {
  name: string;
  members: number;
  online: number;
  description: string;
  bannerImage?: string;
  communityIcon?: string;
  isSubscribed?: boolean;
};

const CommunityHeader = ({
  name,
  members,
  online,
  description,
  bannerImage,
  communityIcon,
  isSubscribed = false,
}: CommunityHeaderProps) => {
  const formattedMembers = members > 1000 ? `${(members / 1000).toFixed(1)}k` : members;
  const initials = name.substring(0, 2).toUpperCase();
  
  return (
    <div className="mb-4">
      {/* Banner */}
      <div 
        className="h-32 bg-primary/20" 
        style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      />
      
      {/* Community Info */}
      <div className="bg-card px-4 py-2 flex items-center">
        {/* Community Icon */}
        <Avatar className="h-16 w-16 border-4 border-background -mt-8 mr-4">
          <AvatarImage src={communityIcon} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">r/{name}</h1>
              <p className="text-sm text-muted-foreground">
                {formattedMembers} members • {online} online
              </p>
            </div>
            
            <Button variant={isSubscribed ? "outline" : "default"}>
              {isSubscribed ? "Joined" : "Join"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start bg-card border-b rounded-none h-auto py-0">
          <TabsTrigger value="posts" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-6">
            Posts
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-6">
            About
          </TabsTrigger>
          <TabsTrigger value="wiki" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-6">
            Wiki
          </TabsTrigger>
          <TabsTrigger value="rules" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-6">
            Rules
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default CommunityHeader;

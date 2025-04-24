import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, Plus, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

const UserProfileSummary = () => {
  return (
    <div className="flex items-center space-x-3 mb-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&auto=format&fit=crop" />
        <AvatarFallback>FX</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-sm">username123</p>
        <p className="text-xs text-muted-foreground">Karma: 2,458</p>
      </div>
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
  const growingCommunities = [
    { name: "Photography", members: "452K", icon: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=48&h=48&auto=format&fit=crop" },
    { name: "CryptoCurrency", members: "327K" },
    { name: "AskForumX", members: "256K" },
    { name: "LifeProTips", members: "189K" },
    { name: "Fitness", members: "143K", icon: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=48&h=48&auto=format&fit=crop" },
  ];

  return (
    <aside className="hidden lg:block fixed top-14 right-0 bottom-0 w-72 p-4 overflow-auto">
      <div className="space-y-4">
        {/* User Profile Card */}
        <Card>
          <CardContent className="pt-4">
            <UserProfileSummary />
            <Button variant="outline" className="w-full mt-2">View Profile</Button>
          </CardContent>
        </Card>

        {/* Create Post Card */}
        <Card>
          <CardContent className="pt-4">
            <Button className="w-full flex items-center gap-1 mb-2">
              <Plus size={16} /> Create Post
            </Button>
            <Link to="/create-community">
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
            {growingCommunities.map((community, index) => (
              <React.Fragment key={community.name}>
                {index > 0 && <Separator className="my-2" />}
                <CommunityItem 
                  name={community.name} 
                  members={community.members} 
                  icon={community.icon} 
                />
              </React.Fragment>
            ))}
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

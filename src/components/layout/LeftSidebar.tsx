
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Star, 
  Users, 
  Plus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

const NavItem = ({ icon, label, active = false }: NavItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={`sidebar-item w-full justify-start ${active ? 'active' : ''}`}
          >
            {icon}
            <span>{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

type CommunityItemProps = {
  name: string;
  image?: string;
  active?: boolean;
};

const CommunityItem = ({ name, image, active = false }: CommunityItemProps) => {
  const fallbackText = name.slice(0, 2).toUpperCase();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={`sidebar-item w-full justify-start ${active ? 'active' : ''}`}
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white overflow-hidden">
              {image ? (
                <img src={image} alt={name} className="w-full h-full object-cover" />
              ) : (
                fallbackText
              )}
            </div>
            <span className="truncate">{name}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const LeftSidebar = () => {
  // Sample community data
  const communities = [
    { name: "Technology", image: "" },
    { name: "Science", image: "" },
    { name: "Gaming", image: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=48&h=48&auto=format&fit=crop" },
    { name: "Movies", image: "" },
    { name: "Music", image: "" },
    { name: "Books", image: "" },
    { name: "Art", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=48&h=48&auto=format&fit=crop" },
    { name: "Food", image: "" },
    { name: "Sports", image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=48&h=48&auto=format&fit=crop" },
    { name: "Programming", image: "" },
  ];

  return (
    <aside className="hidden sm:block fixed top-14 left-0 bottom-0 w-56 bg-sidebar border-r border-sidebar-border overflow-hidden">
      <ScrollArea className="h-full py-4">
        <div className="space-y-1 px-2">
          <NavItem icon={<Home size={18} />} label="Home" active />
          <NavItem icon={<Star size={18} />} label="Popular" />
          <NavItem icon={<Users size={18} />} label="All" />
        </div>
        
        <Separator className="my-4" />
        
        <div className="px-4 mb-2">
          <h3 className="text-sm font-medium text-sidebar-foreground">Subscribed Communities</h3>
        </div>
        
        <div className="space-y-1 px-2">
          {communities.map((community) => (
            <CommunityItem 
              key={community.name} 
              name={community.name} 
              image={community.image}
              active={community.name === "Technology"} 
            />
          ))}
        </div>
        
        <div className="px-2 mt-4">
          <Button className="w-full flex items-center gap-1">
            <Plus size={16} /> Create Community
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default LeftSidebar;

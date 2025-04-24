
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  ChevronDown, 
  LogOut, 
  MessageCircle, 
  Plus, 
  Settings, 
  User 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 px-4">
      <div className="h-full max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left section: Logo and Feed dropdown */}
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl text-primary">ForumX</div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Home
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Feeds</DropdownMenuLabel>
              <DropdownMenuItem>Home</DropdownMenuItem>
              <DropdownMenuItem>Popular</DropdownMenuItem>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Your Communities</DropdownMenuLabel>
              <DropdownMenuItem>Technology</DropdownMenuItem>
              <DropdownMenuItem>Science</DropdownMenuItem>
              <DropdownMenuItem>Sports</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Search bar */}
        <div className="hidden sm:block w-full max-w-xl px-4">
          <div className="relative">
            <Input 
              type="search" 
              placeholder="Search ForumX" 
              className="w-full pl-4 pr-10 py-2 bg-secondary"
            />
          </div>
        </div>

        {/* Right section: Actions and Profile */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <MessageCircle size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell size={20} />
          </Button>
          <Button variant="default" size="sm" className="hidden sm:flex items-center gap-1">
            <Plus size={16} /> Create Post
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&auto=format&fit=crop" />
                  <AvatarFallback>FX</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem>
                <User size={16} className="mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings size={16} className="mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                <LogOut size={16} className="mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

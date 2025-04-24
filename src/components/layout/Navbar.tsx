import React, { useEffect, useState } from "react";
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
  User,
  Video,
  LogIn
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import authService from "@/lib/authService";

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        setUserData(authService.getUser());
      } else {
        setUserData(null);
      }
    };
    
    checkAuth();
    
    // Listen for storage events (in case of login/logout in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserData(null);
    navigate("/login");
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 px-4">
      <div className="h-full max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left section: Logo and Feed dropdown */}
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-xl text-primary">ForumX</Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Home
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Feeds</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/")}>Home</DropdownMenuItem>
              <DropdownMenuItem>Popular</DropdownMenuItem>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Your Communities</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/community/Technology")}>Technology</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/community/Science")}>Science</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/community/Sports")}>Sports</DropdownMenuItem>
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
          {isAuthenticated ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden sm:flex text-primary"
                onClick={() => navigate("/conference")}
              >
                <Video size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <MessageCircle size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Bell size={20} />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="hidden sm:flex items-center gap-1"
                onClick={() => navigate("/create-post")}
              >
                <Plus size={16} /> Create Post
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData?.avatar || ""} />
                      <AvatarFallback>{userData?.displayName?.substring(0, 2) || "FX"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate(`/user/${userData?.username || "user"}`)}>
                    <User size={16} className="mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings size={16} className="mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/conference")}>
                    <Video size={16} className="mr-2" /> Conference
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                    <LogOut size={16} className="mr-2" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="hidden sm:flex items-center gap-1"
              >
                <LogIn size={16} /> Log In
              </Button>
              <Button 
                variant="default"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

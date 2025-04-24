import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, Settings, User, MessageSquare } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary">
      <div className="text-center max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl mb-6">Oops! We couldn't find that page</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for may have been moved, deleted, or might never have existed in the first place.
        </p>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Return to Home
            </Link>
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <Link to="/create-post">
                <MessageSquare className="mr-2 h-4 w-4" /> Create Post
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/user/TechEnthusiast">
                <User className="mr-2 h-4 w-4" /> Profile
              </Link>
            </Button>
          </div>
          
          <div className="pt-4 text-sm text-muted-foreground">
            <p>Looking for something specific?</p>
            <div className="flex gap-4 justify-center mt-2">
              <Link to="/settings" className="text-primary hover:underline flex items-center">
                <Settings className="mr-1 h-3 w-3" /> Settings
              </Link>
              <span>|</span>
              <a href="mailto:help@forumx.com" className="text-primary hover:underline">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

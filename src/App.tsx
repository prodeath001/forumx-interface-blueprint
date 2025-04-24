import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Settings from "./pages/Settings";
import Conference from "./pages/Conference";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateCommunity from "./pages/CreateCommunity";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/community/:communityName" element={<Community />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/create-community" element={<CreateCommunity />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/conference" element={<Conference />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

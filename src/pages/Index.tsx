
import React from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import PostList from "@/components/feed/PostList";
import CommunityHeader from "@/components/community/CommunityHeader";

const Index = () => {
  const isCommunityPage = false; // Toggle this to see community header

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
          <div className="max-w-3xl mx-auto py-4 px-4">
            {isCommunityPage && (
              <CommunityHeader 
                name="Technology" 
                members={2450000}
                online={12543}
                description="For discussion of technology news and innovations."
                bannerImage="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=200&auto=format&fit=crop"
                communityIcon="https://images.unsplash.com/photo-1518770660439-4636190af475?w=48&h=48&auto=format&fit=crop"
              />
            )}
            
            <PostList />
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;

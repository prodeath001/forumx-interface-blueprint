import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import PostList from "@/components/feed/PostList";
import CommunityHeader from "@/components/community/CommunityHeader";
import { useParams } from "react-router-dom";
import communityService, { CommunityDetails } from "@/lib/communityService";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMembers } from "@/lib/utils";

const Community = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const [communityData, setCommunityData] = useState<CommunityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityName) return;
      setLoading(true);
      setError(null);
      try {
        const data = await communityService.getCommunityDetailsByName(communityName);
        if (data) {
          setCommunityData(data);
        } else {
          setError("Community not found.");
        }
      } catch (err) {
        console.error("Error fetching community details:", err);
        setError("Failed to load community details.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [communityName]);

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
            {loading ? (
              <CommunityHeaderSkeleton />
            ) : error ? (
              <div className="bg-white p-8 rounded-lg shadow text-center text-red-500">
                {error}
              </div>
            ) : communityData ? (
              <CommunityHeader 
                name={communityData.name}
                members={communityData.memberCount}
                online={communityData.onlineCount}
                description={communityData.description}
                bannerImage={communityData.bannerImage}
                communityIcon={communityData.icon}
              />
            ) : null}
            
            <PostList communityName={communityName} />
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
};

// Skeleton for Community Header
const CommunityHeaderSkeleton = () => (
  <div className="mb-6">
    <Skeleton className="h-32 w-full rounded-t-lg" />
    <div className="bg-white p-4 rounded-b-lg shadow flex items-end space-x-4 -mt-8 relative pt-10">
      <Skeleton className="h-16 w-16 rounded-full border-4 border-white absolute -bottom-8 left-4" />
      <div className="ml-24 flex-1">
        <Skeleton className="h-7 w-1/3 mb-1" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-9 w-20" /> 
    </div>
    {/* Skeleton for description if needed */}
  </div>
);

export default Community; 
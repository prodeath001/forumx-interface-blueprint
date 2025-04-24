import React, { useState } from "react";
import Post, { PostProps } from "./Post";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const MOCK_POSTS: PostProps[] = [
  {
    id: "1",
    communityName: "technology",
    communityIcon: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=48&h=48&auto=format&fit=crop",
    username: "techguru42",
    timestamp: "5 hours ago",
    title: "The future of AI: What can we expect in the next decade?",
    content: "Artificial intelligence has come a long way in recent years. From machine learning algorithms to deep neural networks, the advancements have been exponential. But what does the future hold?",
    upvotes: 4258,
    downvotes: 124,
    commentCount: 342,
    userVote: "up"
  },
  {
    id: "2",
    communityName: "photography",
    communityIcon: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=48&h=48&auto=format&fit=crop",
    username: "shutterbug",
    timestamp: "8 hours ago",
    title: "My journey through Iceland - A photo essay",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&auto=format&fit=crop",
    upvotes: 6741,
    downvotes: 35,
    commentCount: 129
  },
  {
    id: "3",
    communityName: "science",
    username: "quantum_mind",
    timestamp: "12 hours ago",
    title: "New research suggests possibility of water on exoplanet K2-18b",
    content: "Astronomers have detected water vapor in the atmosphere of K2-18b, an exoplanet orbiting a red dwarf star 110 light-years away. This discovery opens up exciting possibilities for the existence of exoplanets with Earth-like conditions.",
    url: "https://www.nature.com/articles/example",
    upvotes: 2453,
    downvotes: 87,
    commentCount: 201
  },
  {
    id: "4",
    communityName: "gaming",
    communityIcon: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=48&h=48&auto=format&fit=crop",
    username: "gamer_x",
    timestamp: "1 day ago",
    title: "First impressions of the new Horizon game",
    image: "https://images.unsplash.com/photo-1512636618879-bbe79107e9e3?w=800&h=600&auto=format&fit=crop",
    upvotes: 3576,
    downvotes: 142,
    commentCount: 423,
    saved: true
  }
];

type SortOption = "trending" | "hot" | "new" | "top";

const PostList = () => {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const navigate = useNavigate();

  // This would typically use an API call with the sortBy parameter
  const posts = MOCK_POSTS;
  
  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant={sortBy === "hot" ? "default" : "ghost"} 
            className="text-sm"
            onClick={() => setSortBy("hot")}
          >
            Hot
          </Button>
          <Button 
            variant={sortBy === "new" ? "default" : "ghost"} 
            className="text-sm"
            onClick={() => setSortBy("new")}
          >
            New
          </Button>
          <Button 
            variant={sortBy === "top" ? "default" : "ghost"} 
            className="text-sm"
            onClick={() => setSortBy("top")}
          >
            Top
          </Button>
          <Button 
            variant={sortBy === "trending" ? "default" : "ghost"} 
            className="text-sm"
            onClick={() => setSortBy("trending")}
          >
            Trending
          </Button>
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Time Period</SelectLabel>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <Separator className="mb-4" />
      
      <div className="space-y-4">
        {posts.map((post) => (
          <Post 
            key={post.id} 
            {...post} 
            onClick={() => handlePostClick(post.id)} 
          />
        ))}
      </div>
    </div>
  );
};

export default PostList;

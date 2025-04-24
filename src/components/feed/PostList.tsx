import React, { useState, useEffect } from "react";
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
import postService, { PostSortOption, TimePeriodOption } from "@/lib/postService";
import { Post as PostData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = PostSortOption;

const PostList = ({ communityName }: { communityName?: string }) => {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const [timePeriod, setTimePeriod] = useState<TimePeriodOption>("all");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedPosts = communityName 
          ? await postService.getPostsByCommunity(communityName, 1, 10)
          : await postService.getFeedPosts(1, 10);
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sortBy, timePeriod, communityName]);
  
  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };
  
  const formatTimestamp = (timestamp: string | Date): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {(['hot', 'new', 'top', 'trending'] as SortOption[]).map((option) => (
            <Button 
              key={option}
              variant={sortBy === option ? "default" : "ghost"} 
              className="text-sm capitalize"
              onClick={() => setSortBy(option)}
            >
              {option}
            </Button>
          ))}
        </div>
        
        {sortBy === 'top' && (
          <Select 
            value={timePeriod}
            onValueChange={(value) => setTimePeriod(value as TimePeriodOption)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Time Period</SelectLabel>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <Separator className="mb-4" />
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center text-red-500 bg-white p-4 rounded-lg shadow">{error}</div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Post 
              key={post.id} 
              id={post.id}
              communityName={post.communityName || "unknown"}
              communityIcon={post.communityIcon}
              username={post.username}
              timestamp={formatTimestamp(post.createdAt || new Date())}
              title={post.title}
              content={post.content}
              image={post.image}
              url={post.url}
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              commentCount={post.commentCount}
              userVote={post.userVote}
              saved={post.saved}
              onClick={() => handlePostClick(post.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground bg-white p-8 rounded-lg shadow">No posts found.</div>
      )}
    </div>
  );
};

const PostSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 flex space-x-3">
    <div className="flex flex-col items-center w-10">
      <Skeleton className="h-5 w-5 rounded-sm" />
      <Skeleton className="h-4 w-6 my-1" />
      <Skeleton className="h-5 w-5 rounded-sm" />
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center space-x-2 text-xs">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <div className="flex items-center space-x-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  </div>
);

export default PostList;

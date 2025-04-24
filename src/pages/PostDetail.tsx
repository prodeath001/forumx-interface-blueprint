import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, ArrowDownCircle, MessageSquare, Share, BookmarkPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import postService, { Post } from "@/lib/postService";
import interactionsService, { Comment } from "@/lib/interactionsService";
import { Skeleton } from "@/components/ui/skeleton";

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

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!postId) {
        setError("Post ID not found.");
        setLoadingPost(false);
        setLoadingComments(false);
        return;
      }

      setLoadingPost(true);
      setLoadingComments(true);
      setError(null);

      try {
        const postData = await postService.getPostById(postId);
        if (postData) {
          setPost(postData);
        } else {
          throw new Error("Post not found.");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post details.");
      } finally {
        setLoadingPost(false);
      }

      try {
        const commentData = await interactionsService.getComments(postId);
        setComments(commentData);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = (commentText: string) => {
    console.log("Submitting comment:", commentText, "for post:", postId);
  };

  if (loadingPost) {
    return <PostDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navbar />
        <div className="pt-14 flex">
          <LeftSidebar />
          <main className="flex-1 sm:ml-56 lg:mr-72">
            <div className="max-w-3xl mx-auto py-4 px-4">
              <div className="bg-white p-8 rounded-lg shadow text-center text-red-500">
                {error}
              </div>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  if (!post) {
    return <div>Post not found.</div>;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="pt-14 flex">
        <LeftSidebar />
        <main className="flex-1 sm:ml-56 lg:mr-72">
          <div className="max-w-3xl mx-auto py-4 px-4">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.userAvatar} />
                  <AvatarFallback>{post.username?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{post.username}</span>
                <span className="text-xs text-muted-foreground">in {post.communityName}</span>
                <span className="text-xs text-muted-foreground">• {formatTimestamp(post.timestamp)}</span>
              </div>
              
              <h1 className="text-xl font-semibold mb-2">{post.title}</h1>
              
              {post.content && (
                <div className="text-base mb-4 prose max-w-none">
                  {post.content.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
              )}
              {post.image && (
                <img src={post.image} alt={post.title} className="rounded-md mb-4 max-h-96 w-auto mx-auto" />
              )}
              {post.url && (
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm break-all">
                  {post.url}
                </a>
              )}
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <ArrowUpCircle size={18} />
                  </Button>
                  <span className="text-sm font-medium">{post.upvotes - post.downvotes}</span>
                  <Button variant="ghost" size="sm">
                    <ArrowDownCircle size={18} />
                  </Button>
                </div>
                
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <MessageSquare size={18} />
                  <span className="text-sm">{post.commentCount} Comments</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Share size={18} />
                  <span className="text-sm">Share</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <BookmarkPlus size={18} />
                  <span className="text-sm">Save</span>
                </Button>
              </div>
            </div>
            
            <AddCommentForm postId={post.id} onSubmit={handleCommentSubmit} />
            
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h2 className="text-lg font-semibold mb-4">Comments ({comments.length})</h2>
              
              {loadingComments ? (
                <div className="space-y-4">
                  <CommentSkeleton />
                  <CommentSkeleton />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
              )}
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

const AddCommentForm = ({ postId, onSubmit }: { postId: string; onSubmit: (text: string) => void }) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(commentText);
      setCommentText("");
      setIsSubmitting(false);
    }, 500);
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-4">
      <Textarea 
        placeholder="Add a comment..." 
        className="mb-2"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="submit" variant="default" size="sm" disabled={!commentText.trim() || isSubmitting}>
          {isSubmitting ? "Commenting..." : "Comment"}
        </Button>
      </div>
    </form>
  );
};

const CommentItem = ({ comment }: { comment: Comment }) => (
  <div className="border-b pb-4 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 mb-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={comment.userAvatar} />
        <AvatarFallback>{comment.userName?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{comment.userName}</span>
      <span className="text-xs text-muted-foreground">• {formatTimestamp(comment.timestamp)}</span>
    </div>
    
    <div className="text-sm ml-8 mb-2 prose prose-sm max-w-none">
      {comment.content.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </div>
    
    <div className="flex items-center gap-2 ml-8">
      <Button variant="ghost" size="sm" className="h-6 px-1">
        <ArrowUpCircle size={14} />
      </Button>
      <Button variant="ghost" size="sm" className="h-6 px-1">
        <ArrowDownCircle size={14} />
      </Button>
      <Button variant="ghost" size="sm" className="h-6 px-1 text-xs">Reply</Button>
    </div>
  </div>
);

const PostDetailSkeleton = () => (
  <div className="min-h-screen bg-secondary">
    <Navbar />
    <div className="pt-14 flex">
      <LeftSidebar />
      <main className="flex-1 sm:ml-56 lg:mr-72">
        <div className="max-w-3xl mx-auto py-4 px-4">
          <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <Skeleton className="h-16 w-full mb-2" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <CommentSkeleton />
              <CommentSkeleton />
            </div>
          </div>
        </div>
      </main>
      <RightSidebar />
    </div>
  </div>
);

const CommentSkeleton = () => (
  <div className="border-b pb-4 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
    </div>
    <div className="ml-8 space-y-1">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="flex items-center gap-2 ml-8 mt-2">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-6 w-12" />
    </div>
  </div>
);

export default PostDetail; 
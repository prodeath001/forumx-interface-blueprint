import React from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, ArrowDownCircle, MessageSquare, Share, BookmarkPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PostDetail = () => {
  const { postId } = useParams();
  
  // Mock post data (in a real app, this would come from an API)
  const post = {
    id: postId || "1",
    title: "What's your favorite programming language and why?",
    content: "I've been coding for about 5 years now and have used various languages. Currently, I'm most comfortable with JavaScript/TypeScript for web development, but I'm curious what others prefer and why. What language do you enjoy working with the most and what makes it your favorite?",
    author: {
      name: "TechEnthusiast",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&auto=format&fit=crop"
    },
    community: "Programming",
    createdAt: "2 hours ago",
    votes: 128,
    commentCount: 42
  };
  
  // Mock comments data
  const comments = [
    {
      id: "c1",
      author: {
        name: "CodeWizard",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&auto=format&fit=crop"
      },
      content: "Python is my go-to. The readability and versatility are unmatched. I use it for web development with Django, data analysis, and even some machine learning projects. The extensive library ecosystem makes almost any task easier.",
      createdAt: "1 hour ago",
      votes: 24
    },
    {
      id: "c2",
      author: {
        name: "JavaGuru",
        avatar: ""
      },
      content: "I've been using Java for enterprise applications for over a decade now. While it gets criticized for verbosity, the strong typing, excellent tooling, and performance benefits make it worth it for large-scale applications.",
      createdAt: "45 minutes ago",
      votes: 15
    },
    {
      id: "c3",
      author: {
        name: "WebDev23",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=48&h=48&auto=format&fit=crop"
      },
      content: "JavaScript/TypeScript for me as well. The ecosystem has matured so much in recent years. With React, Node.js, and now TypeScript providing type safety, it's become incredibly powerful for full-stack development.",
      createdAt: "30 minutes ago",
      votes: 19
    }
  ];

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
            {/* Post Detail */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              {/* Post Header */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{post.author.name}</span>
                <span className="text-xs text-muted-foreground">in {post.community}</span>
                <span className="text-xs text-muted-foreground">• {post.createdAt}</span>
              </div>
              
              {/* Post Title */}
              <h1 className="text-xl font-semibold mb-2">{post.title}</h1>
              
              {/* Post Content */}
              <div className="text-base mb-4">
                {post.content}
              </div>
              
              {/* Post Actions */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <ArrowUpCircle size={18} />
                  </Button>
                  <span className="text-sm font-medium">{post.votes}</span>
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
            
            {/* Add Comment */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <Textarea placeholder="Add a comment..." className="mb-2" />
              <div className="flex justify-end">
                <Button variant="default" size="sm">Comment</Button>
              </div>
            </div>
            
            {/* Comments */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Comments ({comments.length})</h2>
              
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">• {comment.createdAt}</span>
                    </div>
                    
                    <div className="text-sm ml-8 mb-2">
                      {comment.content}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-8">
                      <Button variant="ghost" size="sm" className="h-6 px-1">
                        <ArrowUpCircle size={14} />
                      </Button>
                      <span className="text-xs font-medium">{comment.votes}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1">
                        <ArrowDownCircle size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-1 text-xs">Reply</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default PostDetail; 
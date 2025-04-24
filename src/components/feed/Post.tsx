import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Share, Star, BookmarkPlus, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

export type PostProps = {
  id: string;
  communityName: string;
  communityIcon?: string;
  username: string;
  timestamp: string;
  title: string;
  content?: string;
  image?: string;
  url?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: 'up' | 'down' | null;
  saved?: boolean;
  onClick?: () => void;
};

const Post = ({
  id,
  communityName,
  communityIcon,
  username,
  timestamp,
  title,
  content,
  image,
  url,
  upvotes,
  downvotes,
  commentCount,
  userVote = null,
  saved = false,
  onClick,
}: PostProps) => {
  const navigate = useNavigate();
  const voteCount = upvotes - downvotes;
  const formattedVoteCount = Math.abs(voteCount) > 999 ? `${(Math.abs(voteCount) / 1000).toFixed(1)}k` : voteCount;
  
  const handleCommunityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/community/${communityName}`);
  };
  
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${username}`);
  };
  
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/post/${id}`);
  };
  
  return (
    <Card className="post-card mb-3 cursor-pointer" onClick={onClick}>
      {/* Vote sidebar */}
      <div className="flex">
        <div className="p-2 flex flex-col items-center bg-secondary rounded-l-lg">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${userVote === 'up' ? 'text-vote-up' : ''}`}
            onClick={(e) => { e.stopPropagation(); }}
          >
            <ArrowUp size={18} />
          </Button>
          
          <span className="text-sm font-medium my-1">{formattedVoteCount}</span>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${userVote === 'down' ? 'text-vote-down' : ''}`}
            onClick={(e) => { e.stopPropagation(); }}
          >
            <ArrowDown size={18} />
          </Button>
        </div>

        <div className="flex-1">
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {/* Community info */}
              <div className="flex items-center">
                {communityIcon ? (
                  <Avatar className="h-5 w-5 mr-1">
                    <AvatarImage src={communityIcon} />
                    <AvatarFallback>{communityName.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                ) : null}
                <span 
                  className="font-medium hover:underline" 
                  onClick={handleCommunityClick}
                >
                  r/{communityName}
                </span>
              </div>
              
              <span>•</span>
              
              <span className="hover:underline" onClick={handleUserClick}>
                Posted by u/{username}
              </span>
              
              <span>•</span>
              
              <span>{timestamp}</span>
            </div>
            
            <h3 className="text-lg font-medium mt-2">{title}</h3>
          </CardHeader>
          
          <CardContent className="p-3 pt-2">
            {content && (
              <div className="text-sm line-clamp-3 mb-3">{content}</div>
            )}
            
            {image && (
              <div className="relative rounded-md overflow-hidden max-h-[28rem]">
                <img src={image} alt={title} className="w-full object-cover" />
              </div>
            )}
            
            {url && !image && (
              <div className="text-sm text-blue-500 hover:underline truncate">
                <a href={url} onClick={(e) => e.stopPropagation()}>{url}</a>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-2 pt-0 flex items-center gap-1 text-muted-foreground">
            <TooltipProvider>
              {/* Comment button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={handleCommentClick}
                  >
                    <MessageCircle size={16} />
                    <span className="text-sm">{commentCount} Comments</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Comments</TooltipContent>
              </Tooltip>
              
              {/* Share button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Share size={16} />
                    <span className="text-sm">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
              
              {/* Save button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex items-center gap-1 ${saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <BookmarkPlus size={16} />
                    <span className="text-sm">{saved ? 'Saved' : 'Save'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{saved ? 'Unsave' : 'Save'}</TooltipContent>
              </Tooltip>
              
              {/* Award button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Star size={16} />
                    <span className="text-sm">Award</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Give Award</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default Post;

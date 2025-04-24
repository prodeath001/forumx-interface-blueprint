export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  icon?: string;
  banner?: string;
  memberCount: number;
  createdAt: Date;
  isJoined?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  url?: string;
  tags?: string[];
  media?: string[];
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  commentCount: number;
  saved: boolean;
  username: string;
  userAvatar?: string;
  communityId?: string;
  communityName?: string;
  communityIcon?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  username: string;
  userAvatar?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  parentId?: string;
  replies?: Comment[];
  replyCount: number;
}

export type PostSortOption = 'hot' | 'new' | 'top' | 'controversial';
export type TimePeriodOption = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'; 
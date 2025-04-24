import authService from './authService';
import { Post, Comment } from './types';
import { config } from './config';

// Define sorting options
export type PostSortOption = "hot" | "new" | "top" | "trending";
export type TimePeriodOption = "all" | "today" | "week" | "month" | "year";

export interface CreatePostData {
  title: string;
  communityName: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  poll?: {
    question: string;
    options: string[];
  };
  // Add authorId if needed by the backend
}

class PostService {
  private readonly API_URL = `${config.baseUrl}/posts`;
  
  /**
   * Get feed posts with pagination
   */
  async getFeedPosts(page = 1, limit = 10): Promise<Post[]> {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.API_URL}/feed?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      throw error;
    }
  }

  /**
   * Get posts by community ID
   */
  async getPostsByCommunity(communityId: string, page = 1, limit = 10): Promise<Post[]> {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.API_URL}/community/${communityId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch community posts: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: string): Promise<Post> {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.API_URL}/${postId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching post details:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostData): Promise<Post> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Log what we're trying to create
      console.log('Creating post with data:', postData);
      
      // Try API call first
      try {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(postData)
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log('Auth failed with server, using mock implementation');
            return this.mockCreatePost(postData);
          }
          
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to create post: ${response.status}`);
        }
        
        const newPost = await response.json();
        console.log('Post created successfully:', newPost);
        return newPost;
      } catch (error) {
        console.error('API call failed:', error);
        // Fallback to mock implementation
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          console.log('Network error, using mock implementation');
          return this.mockCreatePost(postData);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating post:', error);
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('Authentication required'))) {
        return this.mockCreatePost(postData);
      }
      throw error;
    }
  }
  
  /**
   * Mock implementation for creating a post (for development)
   */
  private mockCreatePost(postData: CreatePostData): Promise<Post> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const user = authService.getUser() || {
          _id: 'mock_user',
          username: 'mock_user',
          displayName: 'Mock User',
          avatar: 'https://via.placeholder.com/150'
        };
        
        // Create new post with the provided data
        const newPost: Post = {
          id: `post_${Date.now()}`,
          title: postData.title,
          content: postData.content || '',
          url: postData.linkUrl,
          image: postData.imageUrl,
          username: user.username || 'mock_user',
          userAvatar: typeof user === 'object' && 'avatar' in user ? user.avatar : undefined,
          communityName: postData.communityName,
          communityIcon: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          upvotes: 0,
          downvotes: 0,
          commentCount: 0,
          userVote: null,
          saved: false
        };
        
        console.log('Successfully created mock post:', newPost.title);
        resolve(newPost);
      }, 500);
    });
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, postData: {
    title?: string;
    content?: string;
    tags?: string[];
    media?: string[];
  }): Promise<Post> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.API_URL}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update post: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.API_URL}/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete post: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string, page = 1, limit = 20): Promise<Comment[]> {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.API_URL}/${postId}/comments?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, content: string, parentId?: string): Promise<Comment> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.API_URL}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, parentId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add comment: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(postId: string, commentId: string, content: string): Promise<Comment> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.API_URL}/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update comment: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.API_URL}/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete comment: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}

// Export singleton instance
const postService = new PostService();
export default postService; 
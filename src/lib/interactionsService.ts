// Base API URL
const API_URL = 'http://localhost:5001/api/interactions';

// Types
export type ItemType = 'message' | 'comment' | 'conference' | 'recording' | 'image';

export type Upvote = {
  id: string;
  userId: string;
  itemId: string;
  itemType: ItemType;
  timestamp: Date;
};

export type Downvote = {
  id: string;
  userId: string;
  itemId: string;
  itemType: ItemType;
  timestamp: Date;
};

export type Comment = {
  id: string;
  userId: string;
  itemId: string;
  itemType: ItemType;
  content: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  editedAt?: Date;
  replies: Comment[];
};

export type Share = {
  id: string;
  userId: string;
  itemId: string;
  itemType: ItemType;
  platform: string;
  timestamp: Date;
};

export type Save = {
  id: string;
  userId: string;
  itemId: string;
  itemType: ItemType;
  timestamp: Date;
};

// Utility to convert ISO string dates to Date objects
const convertDates = <T extends { timestamp: string | Date; editedAt?: string | Date }>(
  obj: T
): T => {
  const result = { ...obj };
  if (typeof result.timestamp === 'string') {
    result.timestamp = new Date(result.timestamp) as any;
  }
  if (result.editedAt && typeof result.editedAt === 'string') {
    result.editedAt = new Date(result.editedAt) as any;
  }
  return result;
};

/**
 * Service for handling social interactions
 */
class InteractionsService {
  // UPVOTE METHODS

  /**
   * Add an upvote to an item
   */
  public async addUpvote(
    userId: string,
    itemId: string,
    itemType: ItemType
  ): Promise<Upvote> {
    try {
      const response = await fetch(`${API_URL}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId, itemType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add upvote: ${response.statusText}`);
      }

      const data = await response.json();
      return convertDates(data.upvote);
    } catch (error) {
      console.error('Error adding upvote:', error);
      throw error;
    }
  }

  /**
   * Remove an upvote from an item
   */
  public async removeUpvote(userId: string, itemId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/upvote`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove upvote: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing upvote:', error);
      throw error;
    }
  }

  /**
   * Get upvotes for an item
   */
  public async getUpvotes(itemId: string): Promise<Upvote[]> {
    try {
      const response = await fetch(`${API_URL}/upvotes/${itemId}`);

      if (!response.ok) {
        throw new Error(`Failed to get upvotes: ${response.statusText}`);
      }

      const data = await response.json();
      return data.upvotes.map(convertDates);
    } catch (error) {
      console.error('Error getting upvotes:', error);
      throw error;
    }
  }

  // DOWNVOTE METHODS

  /**
   * Add a downvote to an item
   */
  public async addDownvote(
    userId: string,
    itemId: string,
    itemType: ItemType
  ): Promise<Downvote> {
    try {
      const response = await fetch(`${API_URL}/downvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId, itemType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add downvote: ${response.statusText}`);
      }

      const data = await response.json();
      return convertDates(data.downvote);
    } catch (error) {
      console.error('Error adding downvote:', error);
      throw error;
    }
  }

  /**
   * Remove a downvote from an item
   */
  public async removeDownvote(userId: string, itemId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/downvote`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove downvote: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing downvote:', error);
      throw error;
    }
  }

  /**
   * Get downvotes for an item
   */
  public async getDownvotes(itemId: string): Promise<Downvote[]> {
    try {
      const response = await fetch(`${API_URL}/downvotes/${itemId}`);

      if (!response.ok) {
        throw new Error(`Failed to get downvotes: ${response.statusText}`);
      }

      const data = await response.json();
      return data.downvotes.map(convertDates);
    } catch (error) {
      console.error('Error getting downvotes:', error);
      throw error;
    }
  }

  // COMMENT METHODS

  /**
   * Add a comment to an item
   */
  public async addComment(
    userId: string,
    itemId: string,
    itemType: ItemType,
    content: string,
    userName: string,
    userAvatar?: string
  ): Promise<Comment> {
    try {
      const response = await fetch(`${API_URL}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itemId,
          itemType,
          content,
          userName,
          userAvatar,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      const data = await response.json();
      return convertDates(data.comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  public async updateComment(
    commentId: string,
    content: string
  ): Promise<Comment> {
    try {
      const response = await fetch(`${API_URL}/comment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update comment: ${response.statusText}`);
      }

      const data = await response.json();
      return convertDates(data.comment);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  public async deleteComment(commentId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/comment/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for an item
   */
  public async getComments(itemId: string): Promise<Comment[]> {
    try {
      const response = await fetch(`${API_URL}/comments/${itemId}`);

      if (!response.ok) {
        throw new Error(`Failed to get comments: ${response.statusText}`);
      }

      const data = await response.json();
      return data.comments.map(convertDates);
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // SHARE METHODS

  /**
   * Record a share for an item
   */
  public async shareItem(
    userId: string,
    itemId: string,
    itemType: ItemType,
    platform: string = 'generic'
  ): Promise<Share> {
    try {
      const response = await fetch(`${API_URL}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId, itemType, platform }),
      });

      if (!response.ok) {
        throw new Error(`Failed to record share: ${response.statusText}`);
      }

      const data = await response.json();
      return convertDates(data.share);
    } catch (error) {
      console.error('Error recording share:', error);
      throw error;
    }
  }

  /**
   * Get shares for an item
   */
  public async getShares(itemId: string): Promise<Share[]> {
    try {
      const response = await fetch(`${API_URL}/shares/${itemId}`);

      if (!response.ok) {
        throw new Error(`Failed to get shares: ${response.statusText}`);
      }

      const data = await response.json();
      return data.shares.map(convertDates);
    } catch (error) {
      console.error('Error getting shares:', error);
      throw error;
    }
  }

  // SAVE METHODS

  /**
   * Save an item
   */
  public async saveItem(
    userId: string,
    itemId: string,
    itemType: ItemType
  ): Promise<Save> {
    try {
      const response = await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId, itemType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save item: ${response.statusText}`);
      }

      const data = await response.json();
      return convertDates(data.save);
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  }

  /**
   * Unsave an item
   */
  public async unsaveItem(userId: string, itemId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/save`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to unsave item: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error unsaving item:', error);
      throw error;
    }
  }

  /**
   * Get saved items for a user
   */
  public async getUserSaves(userId: string): Promise<Save[]> {
    try {
      const response = await fetch(`${API_URL}/saves/user/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to get user saves: ${response.statusText}`);
      }

      const data = await response.json();
      return data.saves.map(convertDates);
    } catch (error) {
      console.error('Error getting user saves:', error);
      throw error;
    }
  }

  /**
   * Check if an item is saved by a user
   */
  public async checkSaved(userId: string, itemId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/save/check?userId=${userId}&itemId=${itemId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to check saved status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.isSaved;
    } catch (error) {
      console.error('Error checking saved status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const interactionsService = new InteractionsService();
export default interactionsService; 
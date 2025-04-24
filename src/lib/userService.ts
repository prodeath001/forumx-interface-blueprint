import authService from './authService';

export interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  coverImage?: string;
  createdAt: string;
  joinedDate?: string;
  location?: string;
  stats?: {
    posts: number;
    comments: number;
    karma: number;
  }
}

class UserService {
  private API_URL = 'http://localhost:5001/api';

  /**
   * Get user profile by username
   */
  public async getUserByUsername(username: string): Promise<UserProfile> {
    try {
      // If the username is the current user's username, return their profile data
      const currentUser = authService.getUser();
      
      if (currentUser && currentUser.username === username) {
        // Get fresh data from the profile endpoint
        try {
          const freshUserData = await authService.getProfile();
          return this.formatUserProfile(freshUserData);
        } catch (error) {
          console.error('Error fetching current user profile:', error);
          // Fall back to stored data if API call fails
          return this.formatUserProfile(currentUser);
        }
      }
      
      // For now, since there's no API endpoint to get other users by username,
      // we'll create a mock profile. This should be replaced with a real API call
      // when the endpoint is available
      
      // In a real application with a proper API, this would be:
      // const response = await fetch(`${this.API_URL}/users/${username}`);
      // if (!response.ok) throw new Error('User not found');
      // const data = await response.json();
      // return this.formatUserProfile(data);
      
      const mockUserProfile: UserProfile = {
        _id: `mock_${username}`,
        username: username,
        displayName: username,
        bio: "This user hasn't set a bio yet.",
        avatar: "",
        coverImage: "",
        createdAt: new Date().toISOString(),
        joinedDate: "Recently",
        stats: {
          posts: 0,
          comments: 0,
          karma: 0
        }
      };
      
      return mockUserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
  
  /**
   * Format user data into a consistent profile structure
   */
  private formatUserProfile(userData: any): UserProfile {
    // Calculate joined date in a readable format
    const joinedDate = userData.createdAt 
      ? this.formatJoinedDate(new Date(userData.createdAt))
      : 'Recently';
    
    return {
      _id: userData._id,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      email: userData.email,
      avatar: userData.avatar || '',
      bio: userData.bio || '',
      coverImage: userData.coverImage || '',
      createdAt: userData.createdAt || new Date().toISOString(),
      joinedDate,
      location: userData.location || '',
      stats: {
        posts: userData.stats?.posts || 0,
        comments: userData.stats?.comments || 0,
        karma: userData.stats?.karma || 0
      }
    };
  }
  
  /**
   * Format a date into a readable joined date
   */
  private formatJoinedDate(date: Date): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

// Export singleton instance
const userService = new UserService();
export default userService; 
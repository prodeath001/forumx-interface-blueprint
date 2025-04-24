import authService from './authService';
import { config } from './config';

// Define Community structure (adjust based on actual API response)
export interface CommunitySummary {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  // Add other fields like description, isJoined, etc. if needed
}

export interface Community {
  id: string;
  name: string;
  description: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  members: number;
  tags: string[];
  isPrivate: boolean;
  image?: string;
  createdAt: string;
}

export type CommunitySortOption = "popular" | "new" | "growing";

// Mock data for communities when API is not available
const mockCommunities: Community[] = [
  {
    id: 'community1',
    name: 'Tech Enthusiasts',
    description: 'A community for all tech lovers',
    creator: {
      id: 'user1',
      username: 'techuser',
      displayName: 'Tech User',
      avatar: 'https://via.placeholder.com/150'
    },
    members: 1250,
    tags: ['technology', 'programming', 'gadgets'],
    isPrivate: false,
    image: 'https://via.placeholder.com/300',
    createdAt: '2023-01-15T00:00:00.000Z'
  },
  {
    id: 'community2',
    name: 'Book Club',
    description: 'Discuss your favorite books',
    creator: {
      id: 'user2',
      username: 'bookworm',
      displayName: 'Book Worm',
      avatar: 'https://via.placeholder.com/150'
    },
    members: 850,
    tags: ['books', 'reading', 'literature'],
    isPrivate: false,
    image: 'https://via.placeholder.com/300',
    createdAt: '2023-02-20T00:00:00.000Z'
  },
  {
    id: 'community3',
    name: 'Foodies Unite',
    description: 'For people who love food',
    creator: {
      id: 'user3',
      username: 'foodlover',
      displayName: 'Food Lover',
      avatar: 'https://via.placeholder.com/150'
    },
    members: 725,
    tags: ['food', 'cooking', 'recipes'],
    isPrivate: false,
    image: 'https://via.placeholder.com/300',
    createdAt: '2023-03-10T00:00:00.000Z'
  }
];

class CommunityService {
  private API_URL = 'http://localhost:5001/api/communities'; // Assuming this endpoint exists

  /**
   * Fetch communities (e.g., top growing)
   */
  public async getCommunities(
    sort: CommunitySortOption = "growing",
    limit: number = 100
  ): Promise<CommunitySummary[]> {
    try {
      // Construct the query parameters
      const params = new URLSearchParams();
      params.append('sort', sort);
      params.append('limit', limit.toString());
      
      const url = `${this.API_URL}?${params.toString()}`;
      console.log("Fetching communities from:", url); // Log the URL for debugging

      // Force use real API - don't check connectivity
      // Try to fetch from the API
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch communities: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API returned communities:', data);
      return data.communities || []; // Adjust based on actual API response structure
    } catch (error) {
      console.error('Error fetching communities:', error);
      // Always return an empty array when the API fails - no mock data fallback
      return []; 
    }
  }
  
  /**
   * Fetch details for a specific community by name (Needs corresponding API endpoint)
   */
  public async getCommunityDetailsByName(name: string): Promise<CommunityDetails | null> {
    try {
      const url = `${this.API_URL}/name/${name}`; // Example endpoint structure
      console.log("Fetching community details from:", url);

      // First check if the API is available
      const testResponse = await this.testAPIConnection();
      if (!testResponse) {
        // If API is not available, use mock data
        console.log('Using mock community details data');
        
        // Find the community in our mock data
        const community = mockCommunities.find(c => c.name.toLowerCase() === name.toLowerCase());
        
        if (!community) return null;
        
        // Convert to CommunityDetails format
        const communityDetails: CommunityDetails = {
          id: community.id,
          name: community.name,
          description: community.description,
          memberCount: community.members,
          icon: community.image,
          bannerImage: community.image,
          onlineCount: Math.floor(community.members * 0.1), // Just a mock online count (10% of members)
          createdAt: community.createdAt
        };
        
        return communityDetails;
      }

      // Try to fetch from the API
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null; // Handle not found
        throw new Error(`Failed to fetch community details: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching community details for ${name}:`, error);
      
      // If it's a network error, use mock data
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.log('API server not reachable, using mock data');
        
        // Find the community in our mock data
        const community = mockCommunities.find(c => c.name.toLowerCase() === name.toLowerCase());
        
        if (!community) return null;
        
        // Convert to CommunityDetails format
        const communityDetails: CommunityDetails = {
          id: community.id,
          name: community.name,
          description: community.description,
          memberCount: community.members,
          icon: community.image,
          bannerImage: community.image,
          onlineCount: Math.floor(community.members * 0.1), // Just a mock online count (10% of members)
          createdAt: community.createdAt
        };
        
        return communityDetails;
      }
      
      return null;
    }
  }
  
  /**
   * Fetch communities subscribed by the current user (Needs corresponding API endpoint)
   */
  public async getSubscribedCommunities(): Promise<CommunitySummary[]> {
    try {
      const token = authService.getToken();
      if (!token) return []; // Not logged in, no subscriptions

      const url = `${this.API_URL}?subscribed=true`; // Example endpoint structure
      console.log("Fetching subscribed communities from:", url);

      // No mock data fallback - use real API only
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscribed communities: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.communities || [];
    } catch (error) {
      console.error('Error fetching subscribed communities:', error);
      // Always return empty array instead of mock data
      return [];
    }
  }

  /**
   * Create a new community
   */
  async createCommunity(communityData: {
    name: string;
    description: string;
    tags?: string[];
    isPrivate?: boolean;
    image?: string;
  }): Promise<Community> {
    try {
      const token = authService.getToken();
      console.log('Auth token for community creation:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Format data according to API expectations
      const formattedData = {
        name: communityData.name,
        description: communityData.description,
        tags: communityData.tags || [],
        isPrivate: communityData.isPrivate || false,
        image: communityData.image || ''
      };

      console.log('Creating community with data:', JSON.stringify(formattedData));
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      console.log('Community creation response status:', response.status);
      
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        console.error('Community creation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Community created successfully:', responseData);
      return responseData.community || responseData;
    } catch (error) {
      console.error('Community creation error:', error);
      throw error;
    }
  }

  /**
   * Test if API is available
   */
  private async testAPIConnection(): Promise<boolean> {
    try {
      // Try to fetch with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      // Perform a reachability check to server health endpoint
      await fetch(this.API_URL.replace('/communities', '/health'), { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.warn('API connection test failed:', error);
      return false;
    }
  }

  // Add other methods like getCommunityDetailsById, joinCommunity, etc. as needed
}

// Define detailed Community structure (adjust based on actual API response)
export interface CommunityDetails extends CommunitySummary {
  description: string;
  bannerImage?: string;
  onlineCount?: number;
  createdAt?: string | Date;
  // Add other detailed fields
}

// Export singleton instance
const communityService = new CommunityService();
export default communityService; 
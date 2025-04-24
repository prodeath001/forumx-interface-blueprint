interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  token?: string;
}

interface LoginCredentials {
  username: string; // Can be username or email
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

interface ProfileUpdateData {
  displayName?: string;
  avatar?: string;
  bio?: string;
}

class AuthService {
  private API_URL = 'http://localhost:5001/api/auth';
  private TOKEN_KEY = 'forumx_auth_token';
  private USER_KEY = 'forumx_user';

  /**
   * Register a new user
   */
  public async register(userData: RegisterData): Promise<User> {
    try {
      // First check if the API is available
      const testResponse = await this.testAPIConnection();
      if (!testResponse) {
        // If API is not available, use mock auth for development
        console.log('Using mock authentication for development');
        return this.mockRegister(userData);
      }

      const response = await fetch(`${this.API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register');
      }

      const data = await response.json();
      this.setAuthData(data);
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // If it's a network error, use mock auth for development
      if (error.message.includes('Failed to fetch')) {
        console.log('API server not reachable, using mock authentication');
        return this.mockRegister(userData);
      }
      
      throw error;
    }
  }

  /**
   * Login an existing user
   */
  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      // First check if the API is available
      const testResponse = await this.testAPIConnection();
      if (!testResponse) {
        // If API is not available, use mock auth for development
        console.log('Using mock authentication for development');
        return this.mockLogin(credentials);
      }

      const response = await fetch(`${this.API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid credentials');
      }

      const data = await response.json();
      this.setAuthData(data);
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // If it's a network error, use mock auth for development
      if (error.message.includes('Failed to fetch')) {
        console.log('API server not reachable, using mock authentication');
        return this.mockLogin(credentials);
      }
      
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get the current user's profile
   */
  public async getProfile(): Promise<User> {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // First check if the API is available
      const testResponse = await this.testAPIConnection();
      if (!testResponse) {
        // If API is not available, use mock data
        const user = this.getUser();
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }

      const response = await fetch(`${this.API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get profile');
      }

      const data = await response.json();
      
      // Update stored user data with the latest
      const currentUser = this.getUser();
      this.setUser({ ...currentUser, ...data });
      
      return data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(profileData: ProfileUpdateData): Promise<User> {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // First check if the API is available
      const testResponse = await this.testAPIConnection();
      if (!testResponse) {
        // If API is not available, update local storage only
        const currentUser = this.getUser();
        if (!currentUser) {
          throw new Error('User not found');
        }
        
        const updatedUser = {
          ...currentUser,
          ...profileData,
        };
        
        this.setUser(updatedUser);
        return updatedUser;
      }

      const response = await fetch(`${this.API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update stored user data
      const currentUser = this.getUser();
      this.setUser({ ...currentUser, ...data });
      
      return data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user
   */
  public getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Get authentication token
   */
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store authentication data
   */
  private setAuthData(data: User): void {
    if (data.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token);
    }
    this.setUser(data);
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Test if API is available
   */
  private async testAPIConnection(): Promise<boolean> {
    try {
      // Try to fetch with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const response = await fetch(this.API_URL.replace('/auth', ''), { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Mock register for development without backend
   */
  private mockRegister(userData: RegisterData): Promise<User> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const userId = `user_${Date.now()}`;
        const newUser: User = {
          _id: userId,
          username: userData.username,
          email: userData.email,
          displayName: userData.displayName || userData.username,
          avatar: '',
          bio: '',
          createdAt: new Date().toISOString(),
          token: `mock_token_${userId}`
        };
        
        this.setAuthData(newUser);
        resolve(newUser);
      }, 500);
    });
  }

  /**
   * Mock login for development without backend
   */
  private mockLogin(credentials: LoginCredentials): Promise<User> {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // For development, allow login with any credentials
        if (credentials.username && credentials.password) {
          const userId = `user_${Date.now()}`;
          const user: User = {
            _id: userId,
            username: credentials.username,
            email: `${credentials.username}@example.com`,
            displayName: credentials.username,
            avatar: '',
            bio: 'This is a development account.',
            createdAt: new Date().toISOString(),
            token: `mock_token_${userId}`
          };
          
          this.setAuthData(user);
          resolve(user);
        } else {
          reject(new Error('Username and password are required'));
        }
      }, 500);
    });
  }
}

const authService = new AuthService();
export default authService; 
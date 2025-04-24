// Simple script to test authentication with the server

const fetch = require('node-fetch');

const API_URL = 'http://localhost:5001/api/auth';

async function testAuth() {
  try {
    console.log('Testing server health...');
    
    // First check if server is running
    const healthResponse = await fetch('http://localhost:5001/api/health');
    const healthData = await healthResponse.json();
    console.log('Server health:', healthData);
    
    // Register a new user
    console.log('\nAttempting to register a new user...');
    const registerResponse = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        displayName: 'Test User'
      }),
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response status:', registerResponse.status);
    console.log('Register data:', registerData);
    
    if (registerResponse.ok) {
      // If registration worked, test token with communities endpoint
      const token = registerData.token;
      console.log('\nTesting token with communities endpoint...');
      
      const communitiesResponse = await fetch('http://localhost:5001/api/communities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Communities response status:', communitiesResponse.status);
      
      const communitiesData = await communitiesResponse.json();
      console.log('Communities data:', communitiesData);
      
      // Try creating a community
      console.log('\nTrying to create a community...');
      const createCommunityResponse = await fetch('http://localhost:5001/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `Test Community ${Date.now()}`,
          description: 'This is a test community',
          tags: ['test', 'community'],
          isPrivate: false
        }),
      });
      
      console.log('Create community response status:', createCommunityResponse.status);
      const createCommunityData = await createCommunityResponse.json();
      console.log('Create community data:', createCommunityData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth(); 
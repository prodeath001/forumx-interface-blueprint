import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle } from "lucide-react";
import authService from "@/lib/authService";
import communityService from "@/lib/communityService";

// Add this helper function for development login
const DevLoginSection = () => {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password');
  
  const handleLogin = async () => {
    try {
      await authService.login({ username, password });
      window.location.reload();
    } catch (error) {
      console.error("Dev login failed:", error);
      alert("Login failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };
  
  if (authService.isAuthenticated()) {
    const user = authService.getUser();
    return (
      <div className="p-4 bg-green-50 rounded-md mb-4">
        <p className="text-green-700 font-medium">Logged in as: {user?.username || 'Unknown user'}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => { authService.logout(); window.location.reload(); }}
        >
          Logout
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-yellow-50 rounded-md mb-4">
      <p className="text-yellow-700 font-medium mb-2">You are not logged in. Login for testing:</p>
      <div className="flex gap-2 mb-2">
        <Input 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          className="w-40"
        />
        <Input 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="w-40"
        />
        <Button onClick={handleLogin} size="sm">Login</Button>
      </div>
    </div>
  );
};

const CreateCommunity = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
    isPrivate: false,
    image: ""
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate: checked }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push("Community name is required");
    }
    
    if (formData.name.length > 50) {
      errors.push("Community name must be 50 characters or less");
    }
    
    if (!formData.description.trim()) {
      errors.push("Community description is required");
    }
    
    if (formData.description.length > 500) {
      errors.push("Description must be 500 characters or less");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if user is logged in
      const isAuthenticated = authService.isAuthenticated();
      const token = authService.getToken();
      console.log('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      console.log('Token exists:', token ? 'Yes' : 'No');
      
      if (!isAuthenticated || !token) {
        setFormErrors(["You must be logged in to create a community"]);
        setIsSubmitting(false);
        navigate('/login?redirect=/create-community');
        return;
      }

      // Prepare community data
      const communityData = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPrivate: formData.isPrivate,
        image: formData.image || ''
      };
      
      console.log('Creating community with data:', JSON.stringify(communityData));
      
      // Try a direct API call first
      try {
        console.log('Trying direct API call to create community');
        const directResponse = await fetch('http://localhost:5001/api/communities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(communityData)
        });

        console.log('Direct API response status:', directResponse.status);
        
        if (directResponse.ok) {
          const responseData = await directResponse.json();
          console.log('Community created successfully via direct API:', responseData);
          
          // Get the community ID or name for navigation
          const communityId = responseData.community?.id || responseData.id || formData.name;
          const communityName = responseData.community?.name || responseData.name || formData.name;
          
          // Redirect to the new community page
          console.log(`Navigating to community: ${communityName}`);
          navigate(`/community/${communityName}`);
          return;
        } else {
          console.error('Direct API call failed with status:', directResponse.status);
          try {
            const errorData = await directResponse.json();
            console.error('Error data:', errorData);
          } catch (e) {
            console.error('Could not parse error response');
          }
        }
      } catch (directApiError) {
        console.error('Direct API call error:', directApiError);
      }
      
      // Fallback to using the communityService
      console.log('Falling back to communityService.createCommunity');
      const response = await communityService.createCommunity(communityData);
      console.log('Community created successfully:', response);
      
      // Redirect to the new community page
      const communityName = response.name || formData.name;
      console.log(`Navigating to community: ${communityName}`);
      navigate(`/community/${communityName}`);
    } catch (error) {
      console.error("Error creating community:", error);
      setFormErrors([error instanceof Error ? error.message : "An unknown error occurred"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      
      <div className="pt-14 flex">
        <LeftSidebar />
        
        <main className="flex-1 sm:ml-56">
          <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Development login helper */}
            <DevLoginSection />
          
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle>Create a Community</CardTitle>
                </div>
                <CardDescription>
                  Create a new community to bring people together around a common interest
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {formErrors.length > 0 && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc pl-4">
                        {formErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Community Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter community name"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.name.length}/50 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="What is this community about?"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="technology, design, programming"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add relevant tags to help people find your community
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Community Image URL (optional)</Label>
                    <Input
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="isPrivate">Make this community private</Label>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Create Community"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateCommunity; 
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle } from "lucide-react";

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
      // Get auth token
      const token = localStorage.getItem("token");
      if (!token) {
        setFormErrors(["You must be logged in to create a community"]);
        setIsSubmitting(false);
        return;
      }
      
      // Prepare request body
      const requestBody = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPrivate: formData.isPrivate,
        image: formData.image || undefined
      };
      
      // Make API request
      const response = await fetch("http://localhost:5001/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create community");
      }
      
      // Redirect to the new community page
      navigate(`/community/${data.data?._id || data.data?.id}`);
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
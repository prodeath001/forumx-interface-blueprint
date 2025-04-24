import React, { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bold, Italic, Link, List, ListOrdered, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import cloudinaryService from "@/lib/cloudinaryService";
import { Skeleton } from "@/components/ui/skeleton";
import communityService, { CommunitySummary } from "@/lib/communityService";
import authService from "@/lib/authService";
import postService, { CreatePostData } from "@/lib/postService";

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

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [community, setCommunity] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [activeTab, setActiveTab] = useState("text");
  const [isUploading, setIsUploading] = useState(false);
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login?redirect=/create-post');
      return;
    }

    const fetchCommunities = async () => {
      setLoadingCommunities(true);
      try {
        console.log('Fetching communities for dropdown...');
        
        // Direct API call approach
        try {
          const token = authService.getToken();
          console.log('Using authentication token:', token ? 'Present' : 'Not present');
          
          const response = await fetch('http://localhost:5001/api/communities?limit=100', {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('API response data:', data);
            
            const communities = data.communities || [];
            console.log(`Loaded ${communities.length} communities directly from API`);
            
            if (communities.length > 0) {
              setCommunities(communities);
              setLoadingCommunities(false);
              return;
            }
          }
        } catch (directApiError) {
          console.error('Direct API call failed:', directApiError);
        }
        
        // Fallback to using the service
        console.log('Fallback: Using communityService to fetch communities');
        const fetched = await communityService.getCommunities("popular", 100);
        console.log(`Service returned ${fetched.length} communities`);
        
        if (fetched.length === 0) {
          // Add a dummy community for debugging
          const dummyComm: CommunitySummary = {
            id: 'test1',
            name: 'TestCommunity',
            memberCount: 1,
            icon: ''
          };
          console.log('Adding dummy test community for debugging');
          setCommunities([dummyComm]);
        } else {
          setCommunities(fetched);
        }
      } catch (error) {
        console.error("Error fetching communities:", error);
        toast({ 
          title: "Error", 
          description: "Could not load communities list. Please try again.", 
          variant: "destructive" 
        });
        
        // Add a dummy community for debugging
        const dummyComm: CommunitySummary = {
          id: 'test1',
          name: 'TestCommunity',
          memberCount: 1,
          icon: ''
        };
        console.log('Adding dummy test community after error');
        setCommunities([dummyComm]);
      } finally {
        setLoadingCommunities(false);
      }
    };
    fetchCommunities();
  }, [navigate, toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !community) {
      toast({
        title: "Missing Information",
        description: "Please select a community and enter a title.",
        variant: "destructive"
      });
      return;
    }

    let postData: CreatePostData = { 
      title,
      communityName: community,
    };

    switch (activeTab) {
      case 'text':
        postData.content = content;
        break;
      case 'image':
        if (!imageUrl) {
          toast({ title: "Image Missing", description: "Please upload an image for an image post.", variant: "destructive" });
          return;
        }
        postData.imageUrl = imageUrl;
        break;
      case 'link':
        if (!linkUrl) {
          toast({ title: "Link Missing", description: "Please enter a URL for a link post.", variant: "destructive" });
          return;
        }
        postData.linkUrl = linkUrl;
        break;
      case 'poll':
        const validOptions = pollOptions.filter(opt => opt.trim() !== "");
        if (!pollQuestion || validOptions.length < 2) {
           toast({ title: "Invalid Poll", description: "Please enter a poll question and at least two options.", variant: "destructive" });
          return;
        }
        postData.poll = {
          question: pollQuestion,
          options: validOptions
        };
        break;
    }
    
    console.log('Submitting post data:', postData);
    setIsSubmitting(true);
    
    try {
      const newPost = await postService.createPost(postData);
      
      toast({
        title: "Post Created Successfully",
        description: `Your post "${title}" has been submitted.`,
      });
      
      console.log('Created post, navigating to:', newPost.id);
      navigate(`/post/${newPost.id}`);

    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Could not submit your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const response = await cloudinaryService.uploadFromBlob(file, {
        folder: `forumx-posts/${community || 'general'}`
      });
      setImageUrl(response.secureUrl);
      toast({
        title: "Image Uploaded",
        description: "Your image has been successfully uploaded.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, community]);

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />

      <div className="pt-14 flex">
        <LeftSidebar />

        <main className="flex-1 sm:ml-56">
          <div className="max-w-3xl mx-auto py-6 px-4">
            {/* Development login helper */}
            <DevLoginSection />
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h1 className="text-xl font-semibold">Create a post</h1>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="p-4 border-b">
                  {loadingCommunities ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={community}
                      onValueChange={setCommunity}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a community" />
                      </SelectTrigger>
                      <SelectContent>
                        {communities.length > 0 ? (
                          communities.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No communities found or failed to load.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="p-4">
                  <Input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-4"
                    required
                    maxLength={300}
                  />
                  
                  <Tabs 
                    defaultValue="text" 
                    className="w-full"
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
                      <TabsTrigger value="image" className="flex-1">Image</TabsTrigger>
                      <TabsTrigger value="link" className="flex-1">Link</TabsTrigger>
                      <TabsTrigger value="poll" className="flex-1">Poll</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text">
                      <div className="border rounded-md overflow-hidden">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 border-b">
                          <Button variant="ghost" size="icon" type="button">
                            <Bold size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" type="button">
                            <Italic size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" type="button">
                            <Link size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" type="button">
                            <List size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" type="button">
                            <ListOrdered size={16} />
                          </Button>
                        </div>
                        
                        <Textarea 
                          placeholder="Text (optional)"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="border-0 min-h-[200px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="image">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        title="Image upload input"
                      />
                      <div 
                        className="border-2 border-dashed border-muted-foreground/50 rounded-md p-8 text-center min-h-[200px] flex flex-col justify-center items-center cursor-pointer hover:border-primary transition-colors"
                        onClick={handleUploadButtonClick}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        {isUploading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
                            <Skeleton className="h-4 w-24 mx-auto" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : imageUrl ? (
                          <div className="relative w-full max-w-xs">
                            <img src={imageUrl} alt="Uploaded preview" className="max-h-48 rounded-md mx-auto" />
                            <Button 
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={(e) => { 
                                e.stopPropagation();
                                setImageUrl(null); 
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <ImageIcon size={48} className="mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">Drag and drop an image or</p>
                            <Button variant="outline" type="button">Upload</Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="link">
                      <Input 
                        placeholder="URL" 
                        className="mb-4" 
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="poll">
                      <div className="space-y-4">
                        <Textarea 
                          placeholder="Poll question"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          rows={2}
                          required={activeTab === 'poll'}
                          aria-label="Poll question"
                          title="Poll question"
                        />
                        {pollOptions.map((option, index) => (
                          <Input 
                            key={index}
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                            required={index < 2 && activeTab === 'poll'}
                            aria-label={`Poll option ${index + 1}`}
                            title={`Poll option ${index + 1}`}
                          />
                        ))}
                        {pollOptions.length < 6 && (
                          <Button variant="outline" type="button" onClick={addPollOption} className="w-full">
                            + Add Option
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="flex justify-end gap-2 p-4 border-t bg-muted/50 rounded-b-lg">
                  <Button variant="outline" type="button" onClick={() => navigate("/")} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!title || !community || isUploading || isSubmitting}
                  >
                    {isSubmitting ? "Posting..." : isUploading ? "Uploading..." : "Post"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatePost; 
import React, { useState } from "react";
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
import { Bold, Italic, Link, List, ListOrdered, Image as ImageIcon } from "lucide-react";

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [community, setCommunity] = useState("");
  
  // Mock communities data
  const communities = [
    { name: "Technology" },
    { name: "Science" },
    { name: "Gaming" },
    { name: "Movies" },
    { name: "Music" },
    { name: "Books" },
    { name: "Art" },
    { name: "Food" },
    { name: "Sports" },
    { name: "Programming" },
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, this would send data to an API
    console.log({ title, content, community });
    
    // Navigate to home page after submission
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="pt-14 flex">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <main className="flex-1 sm:ml-56">
          <div className="max-w-3xl mx-auto py-6 px-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h1 className="text-xl font-semibold">Create a post</h1>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="p-4 border-b">
                  <Select
                    value={community}
                    onValueChange={setCommunity}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4">
                  <Input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-4"
                    required
                  />
                  
                  <Tabs defaultValue="text" className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
                      <TabsTrigger value="image" className="flex-1">Image & Video</TabsTrigger>
                      <TabsTrigger value="link" className="flex-1">Link</TabsTrigger>
                      <TabsTrigger value="poll" className="flex-1">Poll</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text">
                      <div className="border rounded-md overflow-hidden">
                        {/* Toolbar */}
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
                          <Button variant="ghost" size="icon" type="button">
                            <ImageIcon size={16} />
                          </Button>
                        </div>
                        
                        {/* Text Area */}
                        <Textarea 
                          placeholder="Text (optional)"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="border-0 min-h-[200px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="image">
                      <div className="border rounded-md p-8 text-center">
                        <ImageIcon size={48} className="mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Drag and drop images or</p>
                        <Button variant="outline" className="mt-2">Upload</Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="link">
                      <Input placeholder="URL" className="mb-4" />
                    </TabsContent>
                    
                    <TabsContent value="poll">
                      <div className="space-y-4">
                        <Input placeholder="Poll question" />
                        <Input placeholder="Option 1" />
                        <Input placeholder="Option 2" />
                        <Button variant="outline" type="button" className="w-full">+ Add Option</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="flex justify-end gap-2 p-4 border-t">
                  <Button variant="outline" type="button" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!title || !community}>
                    Post
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
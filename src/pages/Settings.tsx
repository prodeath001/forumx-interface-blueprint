import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, LockKeyhole, Bell, Eye, Monitor, Moon, Palette, Shield, UserCircle } from "lucide-react";

const Settings = () => {
  // Mock data for user settings
  const [displayName, setDisplayName] = useState("Alex Johnson");
  const [username, setUsername] = useState("TechEnthusiast");
  const [email, setEmail] = useState("alex@example.com");
  const [bio, setBio] = useState("Software engineer passionate about web development and open source. Working on interesting projects and sharing knowledge with the community.");
  const [theme, setTheme] = useState("system");
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send data to an API
    console.log({ displayName, username, email, bio });
    // Show success message
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
          <div className="max-w-4xl mx-auto py-6 px-4">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <Tabs defaultValue="account" className="w-full">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-48">
                  <TabsList className="flex flex-row sm:flex-col h-auto w-full p-0 bg-transparent">
                    <TabsTrigger 
                      value="account" 
                      className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <UserCircle size={16} className="mr-2" />
                      Account
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="privacy" 
                      className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <Shield size={16} className="mr-2" />
                      Privacy
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="notifications" 
                      className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <Bell size={16} className="mr-2" />
                      Notifications
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="appearance" 
                      className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <Palette size={16} className="mr-2" />
                      Appearance
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="security" 
                      className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <LockKeyhole size={16} className="mr-2" />
                      Security
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1">
                  <TabsContent value="account" className="m-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                        <CardDescription>
                          Manage your account information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-20 w-20">
                                <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&auto=format&fit=crop" />
                                <AvatarFallback>AJ</AvatarFallback>
                              </Avatar>
                              <div>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <Camera size={14} />
                                  Change avatar
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="displayName" className="text-right">
                                Display Name
                              </Label>
                              <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="col-span-3"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Username
                              </Label>
                              <div className="col-span-3 flex items-center gap-2">
                                <span>u/</span>
                                <Input
                                  id="username"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                Email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="bio" className="text-right">
                                Bio
                              </Label>
                              <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="col-span-3"
                                rows={4}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit">Save Changes</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="privacy" className="m-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Privacy Settings</CardTitle>
                        <CardDescription>
                          Manage your privacy preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow others to view your profile
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Online Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Display when you're active on the platform
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Allow Direct Messages</Label>
                            <p className="text-sm text-muted-foreground">
                              Let other users send you direct messages
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="m-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>
                          Manage how you receive notifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Post Replies</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone replies to your posts
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Comment Replies</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone replies to your comments
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Mentions</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone mentions you
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="appearance" className="m-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Appearance Settings</CardTitle>
                        <CardDescription>
                          Customize how ForumX looks
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label>Theme</Label>
                          <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Eye size={16} />
                                  <span>Light</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon size={16} />
                                  <span>Dark</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <Monitor size={16} />
                                  <span>System</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Reduce Animation</Label>
                            <p className="text-sm text-muted-foreground">
                              Minimize motion effects
                            </p>
                          </div>
                          <Switch />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="security" className="m-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>
                          Manage your account security
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Change Password</Label>
                          <div className="grid gap-2">
                            <Input type="password" placeholder="Current password" />
                            <Input type="password" placeholder="New password" />
                            <Input type="password" placeholder="Confirm new password" />
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button>Update Password</Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4">
                          <div className="space-y-0.5">
                            <Label>Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Switch />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings; 
import React, { useState, useEffect } from "react";
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
import authService from "@/lib/authService";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Settings = () => {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [theme, setTheme] = useState("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login?redirect=/settings');
      return;
    }
    
    // Load user data
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await authService.getProfile();
        
        setDisplayName(userData.displayName || '');
        setUsername(userData.username || '');
        setEmail(userData.email || '');
        setBio(userData.bio || '');
        setAvatar(userData.avatar || '');
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [navigate, toast]);
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Update profile through authService
      await authService.updateProfile({
        displayName,
        bio,
        avatar
      });
      
      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
                              {loading ? (
                                <Skeleton className="h-20 w-20 rounded-full" />
                              ) : (
                                <Avatar className="h-20 w-20">
                                  <AvatarImage src={avatar} />
                                  <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                              )}
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
                              {loading ? (
                                <Skeleton className="h-10 col-span-3" />
                              ) : (
                                <Input
                                  id="displayName"
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="col-span-3"
                                />
                              )}
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Username
                              </Label>
                              <div className="col-span-3 flex items-center gap-2">
                                <span>u/</span>
                                {loading ? (
                                  <Skeleton className="h-10 flex-1" />
                                ) : (
                                  <Input
                                    id="username"
                                    value={username}
                                    readOnly
                                    disabled
                                    title="Username cannot be changed"
                                    className="flex-1 opacity-70"
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                Email
                              </Label>
                              {loading ? (
                                <Skeleton className="h-10 col-span-3" />
                              ) : (
                                <Input
                                  id="email"
                                  type="email"
                                  value={email}
                                  readOnly
                                  disabled
                                  title="Email cannot be changed here"
                                  className="col-span-3 opacity-70"
                                />
                              )}
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="bio" className="text-right">
                                Bio
                              </Label>
                              {loading ? (
                                <Skeleton className="h-24 col-span-3" />
                              ) : (
                                <Textarea
                                  id="bio"
                                  value={bio}
                                  onChange={(e) => setBio(e.target.value)}
                                  className="col-span-3"
                                  rows={4}
                                />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={loading || saving}>
                              {saving ? "Saving..." : "Save Changes"}
                            </Button>
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
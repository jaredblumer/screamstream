import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Settings, 
  Heart, 
  Eye, 
  TrendingUp, 
  Calendar, 
  Star, 
  Film,
  Bell,
  Shield,
  Palette,
  Save,
  Camera
} from "lucide-react";
import Header from "@/components/header";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";
import { Movie } from "@shared/schema";

export default function Profile() {
  const [searchQuery, setSearchQuery] = useState("");
  const { watchlistCount, isAuthenticated } = useWatchlist();
  const { toast } = useToast();
  
  // Profile state
  const [profile, setProfile] = useState({
    name: "Horror Fan",
    email: "fan@screamstream.com",
    bio: "Love discovering top-ranked streaming horror - from classic Universal monsters to modern psychological thrillers.",
    avatar: "",
    joinDate: "October 2023",
    favoriteGenre: "Supernatural",
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      spoilerWarnings: true,
      autoplay: false,
      darkMode: true,
    }
  });

  // Fetch movies for statistics
  const { data: allMovies = [] } = useQuery<Movie[]>({
    queryKey: ["/api/content"],
  });

  // Calculate user statistics
  const totalMovies = allMovies.length;
  const recentlyViewed = 23; // Mock data - would be stored in user preferences
  const averageRating = 7.4; // Mock data
  const hoursWatched = 147; // Mock data

  const handleProfileUpdate = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const topGenres = [
    { name: "Supernatural", count: 12, percentage: 35 },
    { name: "Psychological", count: 8, percentage: 24 },
    { name: "Slasher", count: 6, percentage: 18 },
    { name: "Monster", count: 5, percentage: 15 },
    { name: "Zombie", count: 3, percentage: 8 }
  ];

  if (!isAuthenticated) {
    return (
      <>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="min-h-screen horror-bg">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-24">
            <User className="h-16 w-16 text-gray-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-6">Sign In to Access Your Profile</h1>
            <p className="text-xl text-gray-300 mb-8">
              Create an account to access your profile, view your watchlist statistics, and manage your preferences.
            </p>
            <Button 
              className="horror-button-primary px-8 py-3"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign In to Get Started
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="min-h-screen horror-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Profile Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-red-900 border-4 border-red-600 flex items-center justify-center">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="h-16 w-16 text-white" />
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="absolute bottom-0 right-0 rounded-full horror-button-primary h-8 w-8 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="mt-4 bg-red-900 text-red-100">
                  Member since {profile.joinDate}
                </Badge>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                <p className="text-gray-300 mb-4">{profile.email}</p>
                <p className="text-gray-400 mb-6 max-w-2xl">{profile.bio}</p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold blood-red">{watchlistCount}</div>
                    <div className="text-sm text-gray-400">Watchlist</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold blood-red">{recentlyViewed}</div>
                    <div className="text-sm text-gray-400">Watched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold blood-red">{averageRating}</div>
                    <div className="text-sm text-gray-400">Avg Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold blood-red">{hoursWatched}h</div>
                    <div className="text-sm text-gray-400">Hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="overview" className="animate-slide-up">
            <TabsList className="grid w-full grid-cols-4 dark-gray-bg border-gray-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-red-600">Overview</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-red-600">Settings</TabsTrigger>
              <TabsTrigger value="statistics" className="data-[state=active]:bg-red-600">Statistics</TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-red-600">Preferences</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="dark-gray-bg border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 blood-red" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded border border-gray-700">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 text-red-400 mr-3" />
                        <span className="text-white">Added to watchlist</span>
                      </div>
                      <span className="text-gray-400 text-sm">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded border border-gray-700">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-green-400 mr-3" />
                        <span className="text-white">Watched The Conjuring</span>
                      </div>
                      <span className="text-gray-400 text-sm">1 day ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded border border-gray-700">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-3" />
                        <span className="text-white">Rated Hereditary 9/10</span>
                      </div>
                      <span className="text-gray-400 text-sm">3 days ago</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Favorite Genres */}
                <Card className="dark-gray-bg border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Film className="h-5 w-5 mr-2 blood-red" />
                      Favorite Genres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topGenres.map((genre) => (
                      <div key={genre.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {genre.name}
                          </Badge>
                          <span className="text-gray-400 text-sm ml-2">
                            {genre.count} movies
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-700 rounded-full mr-2">
                            <div 
                              className="h-full bg-red-600 rounded-full"
                              style={{ width: `${genre.percentage}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-sm w-10">{genre.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card className="dark-gray-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="h-5 w-5 mr-2 blood-red" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Display Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="horror-bg border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="horror-bg border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      className="horror-bg border-gray-700 text-white"
                    />
                  </div>
                  <Button onClick={handleProfileUpdate} className="horror-button-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="dark-gray-bg border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Film className="h-8 w-8 blood-red mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{totalMovies}</div>
                    <div className="text-gray-400">Total Movies</div>
                  </CardContent>
                </Card>
                <Card className="dark-gray-bg border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Eye className="h-8 w-8 blood-red mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{recentlyViewed}</div>
                    <div className="text-gray-400">Movies Watched</div>
                  </CardContent>
                </Card>
                <Card className="dark-gray-bg border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Heart className="h-8 w-8 blood-red mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{watchlistCount}</div>
                    <div className="text-gray-400">In Watchlist</div>
                  </CardContent>
                </Card>
                <Card className="dark-gray-bg border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 blood-red mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{hoursWatched}</div>
                    <div className="text-gray-400">Hours Watched</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="dark-gray-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Viewing History</CardTitle>
                  <CardDescription className="text-gray-400">Your horror movie journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Detailed viewing statistics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6 mt-6">
              <Card className="dark-gray-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bell className="h-5 w-5 mr-2 blood-red" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Email Notifications</Label>
                      <p className="text-gray-400 text-sm">Receive updates about new horror releases</p>
                    </div>
                    <Switch
                      checked={profile.preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                    />
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Push Notifications</Label>
                      <p className="text-gray-400 text-sm">Get notified about watchlist updates</p>
                    </div>
                    <Switch
                      checked={profile.preferences.pushNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                    />
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Spoiler Warnings</Label>
                      <p className="text-gray-400 text-sm">Hide plot details and ratings</p>
                    </div>
                    <Switch
                      checked={profile.preferences.spoilerWarnings}
                      onCheckedChange={(checked) => handlePreferenceChange('spoilerWarnings', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-gray-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Palette className="h-5 w-5 mr-2 blood-red" />
                    Display Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Dark Mode</Label>
                      <p className="text-gray-400 text-sm">Perfect for late-night horror sessions</p>
                    </div>
                    <Switch
                      checked={profile.preferences.darkMode}
                      onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                    />
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Autoplay Trailers</Label>
                      <p className="text-gray-400 text-sm">Automatically play movie previews</p>
                    </div>
                    <Switch
                      checked={profile.preferences.autoplay}
                      onCheckedChange={(checked) => handlePreferenceChange('autoplay', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-12 text-center animate-slide-up stagger-2">
            <Card className="dark-gray-bg border-gray-700 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Continue Your Horror Journey?
              </h3>
              <p className="text-gray-300 mb-6">
                Discover new terrors or revisit your saved favorites.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button className="horror-button-primary">
                    Browse Movies
                  </Button>
                </Link>
                <Link href="/watchlist">
                  <Button variant="outline" className="horror-button-outline">
                    View Watchlist
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
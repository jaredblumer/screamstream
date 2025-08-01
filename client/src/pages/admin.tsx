import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit, Plus, Save, X, Database, EyeOff, Eye, Image, Search, Download } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Content, InsertContent, PlatformImage, InsertPlatformImage, Subgenre } from "@shared/schema";
import WatchmodeSync from "@/components/watchmode-sync";
import { SubgenresManagement } from "@/components/subgenres-management";

interface ContentFormData {
  title: string;
  year: number;
  rating: number;
  criticsRating: number;
  usersRating: number;
  description: string;
  posterUrl: string;
  subgenres: string[];
  primarySubgenre?: string;
  platforms: string[];
  platformLinks: string[];
  type: "movie" | "series";
}

const initialFormData: ContentFormData = {
  title: "",
  year: new Date().getFullYear(),
  rating: 0,
  criticsRating: 0,
  usersRating: 0,
  description: "",
  posterUrl: "",
  subgenres: [],
  primarySubgenre: "",
  platforms: [],
  platformLinks: [],
  type: "movie"
};



// Platform Images Manager Component
function PlatformImagesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<PlatformImage | null>(null);
  const [formData, setFormData] = useState({
    platformKey: "",
    platformName: "",
    imageUrl: "",
    isActive: true
  });

  // Fetch platform images
  const { data: platformImages = [], isLoading } = useQuery<PlatformImage[]>({
    queryKey: ["/api/admin/platform-images"],
    queryFn: async () => {
      const response = await fetch("/api/admin/platform-images");
      if (!response.ok) {
        throw new Error("Failed to fetch platform images");
      }
      return response.json();
    },
  });

  // Create platform image mutation
  const createImageMutation = useMutation({
    mutationFn: async (data: InsertPlatformImage) => {
      const response = await fetch("/api/admin/platform-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create platform image");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Platform image created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-images"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create platform image",
        variant: "destructive",
      });
    },
  });

  // Update platform image mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertPlatformImage }) => {
      const response = await fetch(`/api/admin/platform-images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update platform image");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Platform image updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-images"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update platform image",
        variant: "destructive",
      });
    },
  });

  // Delete platform image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/platform-images/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete platform image");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Platform image deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-images"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete platform image",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      platformKey: "",
      platformName: "",
      imageUrl: "",
      isActive: true
    });
    setEditingImage(null);
  };

  const openEditDialog = (image?: PlatformImage) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        platformKey: image.platformKey,
        platformName: image.platformName,
        imageUrl: image.imageUrl,
        isActive: image.isActive
      });
    } else {
      resetForm();
    }
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingImage) {
      updateImageMutation.mutate({ id: editingImage.id, data: formData });
    } else {
      createImageMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading platform images...</div>;
  }

  return (
    <Card className="horror-bg border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center">
          <Image className="w-5 h-5 mr-2" />
          Platform Images ({platformImages.length})
        </CardTitle>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()} className="horror-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Platform Image
            </Button>
          </DialogTrigger>
          <DialogContent className="horror-bg border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingImage ? "Edit Platform Image" : "Add Platform Image"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="platformKey" className="text-white">Platform Key</Label>
                <Input
                  id="platformKey"
                  value={formData.platformKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, platformKey: e.target.value }))}
                  placeholder="netflix, hulu, amazon_prime, etc."
                  className="horror-bg border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="platformName" className="text-white">Platform Name</Label>
                <Input
                  id="platformName"
                  value={formData.platformName}
                  onChange={(e) => setFormData(prev => ({ ...prev, platformName: e.target.value }))}
                  placeholder="Netflix, Hulu, Amazon Prime, etc."
                  className="horror-bg border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="horror-bg border-gray-700 text-white"
                />
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-16 h-16 object-contain rounded border border-gray-600"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                  className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <Label htmlFor="isActive" className="text-white">
                  Active (show in UI)
                </Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="horror-button-outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createImageMutation.isPending || updateImageMutation.isPending}
                  className="horror-button-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingImage ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platformImages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No platform images configured. Add some to customize platform logos.
            </div>
          ) : (
            platformImages.map((image) => (
              <div key={image.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img 
                    src={image.imageUrl} 
                    alt={image.platformName}
                    className="w-12 h-12 object-contain rounded border border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNCAzMkMxNi4yNjggMzIgMTAgMjUuNzMyIDEwIDE4UzE2LjI2OCA0IDI0IDRTMzggMTAuMjY4IDM4IDE4UzMxLjczMiAzMiAyNCAzMloiIGZpbGw9IiM2QjczODAiLz4KPHBhdGggZD0iTTI0IDEwQzI2LjIwOTEgMTAgMjggMTEuNzkwOSAyOCAxNEMyOCAxNi4yMDkxIDI2LjIwOTEgMTggMjQgMThDMjEuNzkwOSAxOCAyMCAxNi4yMDkxIDIwIDE0QzIwIDExLjc5MDkgMjEuNzkwOSAxMCAyNCAxMFoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTI0IDIwQzI2LjIwOTEgMjAgMjggMjEuNzkwOSAyOCAyNEMyOCAyNi4yMDkxIDI2LjIwOTEgMjggMjQgMjhDMjEuNzkwOSAyOCAyMCAyNi4yMDkxIDIwIDI0QzIwIDIxLjc5MDkgMjEuNzkwOSAyMCAyNCAyMFoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==';
                    }}
                  />
                  <div>
                    <div className="text-white font-medium">{image.platformName}</div>
                    <div className="text-gray-400 text-sm">{image.platformKey}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={image.isActive ? "default" : "secondary"}>
                        {image.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => openEditDialog(image)}
                    size="sm"
                    variant="outline"
                    className="horror-button-outline"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the ${image.platformName} platform image?`)) {
                        deleteImageMutation.mutate(image.id);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="border-red-800 text-red-400 hover:bg-red-900/20"
                    disabled={deleteImageMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [formData, setFormData] = useState<ContentFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch subgenres from database
  const { data: subgenres, isLoading: subgenresLoading } = useQuery<Subgenre[]>({
    queryKey: ["/api/admin/subgenres"],
    queryFn: async () => {
      const response = await fetch("/api/admin/subgenres");
      if (!response.ok) {
        throw new Error("Failed to fetch subgenres");
      }
      return response.json();
    },
  });

  // Extract genre slug for the dropdown in content form
  const genres = subgenres?.map((s: any) => s.slug) || [];

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
    
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, user?.role, toast]);

  // Fetch content data
  const { data: content = [], isLoading } = useQuery<Content[]>({
    queryKey: ["/api/admin/content"],
    retry: false,
  });

  // Get hidden content only
  const { data: hiddenContent = [] } = useQuery<Content[]>({
    queryKey: ["/api/admin/content/hidden"],
    retry: false,
  });

  // Create content mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertContent) => {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Content created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive",
      });
    },
  });

  // Update content mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertContent> }) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Content updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Content deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/hidden"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  // Hide content mutation
  const hideContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}/hide`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Content hidden from public display" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/hidden"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to hide content",
        variant: "destructive",
      });
    },
  });

  // Show content mutation
  const showContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}/show`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Content restored to public display" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/hidden"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to show content",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingContent(null);
  };

  const openEditDialog = (content?: Content) => {
    if (content) {
      setEditingContent(content);
      
      // Ensure platformLinks array matches platforms array length
      const platforms = content.platforms || [];
      const platformLinks = content.platformLinks || [];
      
      // Pad platformLinks array if it's shorter than platforms array
      const normalizedPlatformLinks = [...platformLinks];
      while (normalizedPlatformLinks.length < platforms.length) {
        normalizedPlatformLinks.push("");
      }
      
      setFormData({
        title: content.title,
        year: content.year,
        rating: content.rating,
        criticsRating: content.criticsRating || content.rating,
        usersRating: content.usersRating || 0,
        description: content.description,
        posterUrl: content.posterUrl,
        subgenres: content.subgenres || [],
        primarySubgenre: content.subgenre, // Current subgenre field becomes primary
        platforms: platforms,
        platformLinks: normalizedPlatformLinks,
        type: content.type,
      });
    } else {
      resetForm();
    }
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    const submitData: InsertContent = {
      ...formData,
      subgenre: formData.primarySubgenre || (formData.subgenres.length > 0 ? formData.subgenres[0] : ""), // Use primary subgenre for browse display
      platforms: formData.platforms,
      platformLinks: formData.platformLinks,
    };

    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };



  const handlePlatformLinkChange = (platformIndex: number, link: string) => {
    setFormData(prev => {
      // Ensure platformLinks array is at least as long as platforms array
      const newPlatformLinks = [...prev.platformLinks];
      while (newPlatformLinks.length < prev.platforms.length) {
        newPlatformLinks.push("");
      }
      
      // Update the specific platform link
      newPlatformLinks[platformIndex] = link;
      
      return {
        ...prev,
        platformLinks: newPlatformLinks
      };
    });
  };



  // Filter content based on search query
  const filteredContent = (content as Content[]).filter((item: Content) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.subgenre.toLowerCase().includes(query) ||
      (item.subgenres && item.subgenres.some(sg => sg.toLowerCase().includes(query))) ||
      item.year.toString().includes(query)
    );
  });

  const movies = filteredContent.filter((item: Content) => item.type === "movie");
  const series = filteredContent.filter((item: Content) => item.type === "series");

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen horror-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen horror-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openEditDialog()} className="horror-button-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="horror-bg border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingContent ? "Edit Content" : "Add New Content"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="horror-bg border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-white">Type</Label>
                    <Select value={formData.type} onValueChange={(value: "movie" | "series") => 
                      setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                        <SelectValue className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="horror-bg border-gray-700 horror-select-content">
                        <SelectItem value="movie" className="horror-select-item">Movie</SelectItem>
                        <SelectItem value="series" className="horror-select-item">Series</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="year" className="text-white">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="horror-bg border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="criticsRating" className="text-white">Critics Rating (0-10)</Label>
                    <Input
                      id="criticsRating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.criticsRating.toFixed(1)}
                      onChange={(e) => setFormData(prev => ({ ...prev, criticsRating: Math.round(parseFloat(e.target.value) * 10) / 10 }))}
                      className="horror-bg border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usersRating" className="text-white">Users Rating (0-10)</Label>
                    <Input
                      id="usersRating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.usersRating.toFixed(1)}
                      onChange={(e) => setFormData(prev => ({ ...prev, usersRating: Math.round(parseFloat(e.target.value) * 10) / 10 }))}
                      className="horror-bg border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Subgenres (Select Multiple)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2 p-4 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                    {genres.map(genre => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subgenre-${genre}`}
                          checked={formData.subgenres.includes(genre)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => {
                                const newSubgenres = [...prev.subgenres, genre];
                                return { 
                                  ...prev, 
                                  subgenres: newSubgenres,
                                  // Auto-default primary subgenre when exactly one is selected
                                  primarySubgenre: newSubgenres.length === 1 ? newSubgenres[0] : prev.primarySubgenre
                                };
                              });
                            } else {
                              setFormData(prev => {
                                const newSubgenres = prev.subgenres.filter(s => s !== genre);
                                return { 
                                  ...prev, 
                                  subgenres: newSubgenres,
                                  // Auto-default primary subgenre when exactly one is selected, clear if deselecting current primary
                                  primarySubgenre: newSubgenres.length === 1 ? newSubgenres[0] : 
                                                  (prev.primarySubgenre === genre ? "" : prev.primarySubgenre)
                                };
                              });
                            }
                          }}
                          className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <Label 
                          htmlFor={`subgenre-${genre}`} 
                          className="text-white text-sm cursor-pointer"
                        >
                          {genre}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {formData.subgenres.length > 0 ? formData.subgenres.join(", ") : "None"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="primarySubgenre" className="text-white">Primary Subgenre (Browse Display)</Label>
                  <Select 
                    value={formData.primarySubgenre || ""} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, primarySubgenre: value }))}
                  >
                    <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                      <SelectValue placeholder="Select primary subgenre for browse pages" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="horror-bg border-gray-700 horror-select-content">
                      {formData.subgenres.map(genre => (
                        <SelectItem key={genre} value={genre} className="horror-select-item">{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">
                    This subgenre will be displayed on browse pages. All selected subgenres will appear on the movie detail page.
                  </p>
                </div>

                <div>
                  <Label htmlFor="posterUrl" className="text-white">Poster URL</Label>
                  <div className="space-y-2">
                    <Input
                      id="posterUrl"
                      value={formData.posterUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
                      className="horror-bg border-gray-700 text-white"
                      placeholder="https://artworks.thetvdb.com/banners/movies/..."
                    />
                    {formData.posterUrl && (
                      <div className="flex items-start space-x-3">
                        <div className="text-xs text-gray-400">Preview:</div>
                        <img 
                          src={formData.posterUrl} 
                          alt="Poster preview"
                          className="w-12 h-18 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {editingContent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/content/${editingContent.id}/fix-poster`, {
                              method: 'POST'
                            });
                            if (response.ok) {
                              const updated = await response.json();
                              setFormData(prev => ({ ...prev, posterUrl: updated.posterUrl }));
                              toast({ title: "Success", description: "Poster URL updated with TVDB image" });
                            } else {
                              toast({ title: "Error", description: "Could not find TVDB poster for this title", variant: "destructive" });
                            }
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to update poster URL", variant: "destructive" });
                          }
                        }}
                        className="text-xs horror-button-outline"
                      >
                        <Database className="w-3 h-3 mr-1" />
                        Fix with TVDB
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="horror-bg border-gray-700 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-white">Streaming Platforms</Label>
                  <p className="text-sm text-gray-400 mb-2">Enter platform names (one per line)</p>
                  <Textarea
                    value={formData.platforms.join('\n')}
                    onChange={(e) => {
                      const platforms = e.target.value.split('\n').filter(p => p.trim() !== '');
                      setFormData(prev => ({
                        ...prev,
                        platforms,
                        platformLinks: platforms.map((_, index) => prev.platformLinks[index] || '')
                      }));
                    }}
                    placeholder="Netflix&#10;Amazon Prime Video&#10;Hulu&#10;Shudder"
                    className="horror-bg border-gray-700 text-white"
                    rows={4}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Examples: Netflix, Amazon Prime Video, Hulu, HBO Max, Disney+, Shudder
                  </p>
                </div>

                {/* Platform Links Section */}
                {formData.platforms.length > 0 && (
                  <div>
                    <Label className="text-white">Streaming Links</Label>
                    <p className="text-sm text-gray-400 mb-2">Add streaming links for each selected platform</p>
                    <div className="space-y-2">
                      {formData.platforms.map((platform, index) => (
                        <div key={platform} className="flex items-center space-x-2">
                          <span className="text-white text-sm capitalize w-24 flex-shrink-0">
                            {platform.replace('_', ' ')}:
                          </span>
                          <Input
                            value={formData.platformLinks[index] || ''}
                            onChange={(e) => handlePlatformLinkChange(index, e.target.value)}
                            placeholder={`https://link-to-${platform.replace('_', '-')}.com`}
                            className="horror-bg border-gray-700 text-white flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    className="horror-button-outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="horror-button-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingContent ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>


        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="horror-bg border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              All Content ({filteredContent.length})
            </TabsTrigger>
            <TabsTrigger value="movies" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              Movies ({movies.length})
            </TabsTrigger>
            <TabsTrigger value="series" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              Series ({series.length})
            </TabsTrigger>

            <TabsTrigger value="hidden" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <EyeOff className="w-4 h-4 mr-2" />
              Hidden Content ({hiddenContent.length})
            </TabsTrigger>
            <TabsTrigger value="watchmode" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />
              Sync
            </TabsTrigger>
            <TabsTrigger value="platform-images" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <Image className="w-4 h-4 mr-2" />
              Platform Images
            </TabsTrigger>
            <TabsTrigger value="subgenres" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              Subgenres
            </TabsTrigger>

          </TabsList>

          {/* Search input for filtering content - only show on content tabs */}
          {(activeTab === 'all' || activeTab === 'movies' || activeTab === 'series' || activeTab === 'hidden') && (
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content by title, description, subgenre, or year..."
                className="horror-bg border-gray-700 text-white pl-10 pr-4"
              />
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-2">
                Showing {filteredContent.length} result(s) for "{searchQuery}"
              </p>
            )}
          </div>
          )}

          <TabsContent value="all">
            <ContentTable 
              content={filteredContent} 
              onEdit={openEditDialog} 
              onDelete={(id) => {
                if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
                  deleteMutation.mutate(id);
                }
              }}
              onHide={(id) => hideContentMutation.mutate(id)}
              onShow={(id) => showContentMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
              isHiding={hideContentMutation.isPending}
              isShowing={showContentMutation.isPending}
              showVisibilityControls={true}
            />
          </TabsContent>

          <TabsContent value="movies">
            <ContentTable 
              content={movies} 
              onEdit={openEditDialog} 
              onDelete={(id) => {
                if (window.confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
                  deleteMutation.mutate(id);
                }
              }}
              onHide={(id) => hideContentMutation.mutate(id)}
              onShow={(id) => showContentMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
              isHiding={hideContentMutation.isPending}
              isShowing={showContentMutation.isPending}
              showVisibilityControls={true}
            />
          </TabsContent>

          <TabsContent value="series">
            <ContentTable 
              content={series} 
              onEdit={openEditDialog} 
              onDelete={(id) => {
                if (window.confirm("Are you sure you want to delete this series? This action cannot be undone.")) {
                  deleteMutation.mutate(id);
                }
              }}
              onHide={(id) => hideContentMutation.mutate(id)}
              onShow={(id) => showContentMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
              isHiding={hideContentMutation.isPending}
              isShowing={showContentMutation.isPending}
              showVisibilityControls={true}
            />
          </TabsContent>




          <TabsContent value="hidden">
            <Card className="horror-bg border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <EyeOff className="w-5 h-5 mr-2" />
                  Hidden Content ({hiddenContent.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContentTable 
                  content={hiddenContent} 
                  onEdit={openEditDialog} 
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onHide={(id) => hideContentMutation.mutate(id)}
                  onShow={(id) => showContentMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                  isHiding={hideContentMutation.isPending}
                  isShowing={showContentMutation.isPending}
                  showVisibilityControls={true}
                  isHiddenContent={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchmode">
            <WatchmodeSync />
          </TabsContent>

          <TabsContent value="platform-images">
            <PlatformImagesManager />
          </TabsContent>

          <TabsContent value="subgenres">
            <SubgenresManagement />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

interface ContentTableProps {
  content: Content[];
  onEdit: (content: Content) => void;
  onDelete: (id: number) => void;
  onHide?: (id: number) => void;
  onShow?: (id: number) => void;
  isDeleting: boolean;
  isHiding?: boolean;
  isShowing?: boolean;
  showVisibilityControls?: boolean;
  isHiddenContent?: boolean;
}

function ContentTable({ 
  content, 
  onEdit, 
  onDelete, 
  onHide, 
  onShow, 
  isDeleting, 
  isHiding, 
  isShowing, 
  showVisibilityControls = false,
  isHiddenContent = false
}: ContentTableProps) {
  if (content.length === 0) {
    return (
      <Card className="horror-bg border-gray-700">
        <CardContent className="py-8 text-center">
          <p className="text-gray-400">No content found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {content.map((item) => (
        <Card key={item.id} className="horror-bg border-gray-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex space-x-4">
                {item.posterUrl && (
                  <img 
                    src={item.posterUrl} 
                    alt={item.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <Badge variant="outline" className="border-red-800 text-red-400">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-gray-300">
                    {item.year} • Critics: {(item.criticsRating || item.rating).toFixed(1)}/10
                    {item.usersRating && ` • Users: ${item.usersRating.toFixed(1)}/10`}
                  </p>
                  <p className="text-gray-400">{item.subgenres && item.subgenres.length > 0 ? item.subgenres.join(", ") : item.subgenre}</p>
                  
                  {/* Subgenres section */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.subgenres && item.subgenres.length > 0 ? (
                      item.subgenres.map(subgenre => (
                        <Badge key={subgenre} variant="outline" className="text-xs border-purple-500 text-purple-400">
                          {subgenre.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400 bg-yellow-500/10">
                        ⚠️ Missing Subgenres
                      </Badge>
                    )}
                  </div>

                  {/* Platforms section */}
                  <div className="flex flex-wrap gap-1">
                    {item.platforms && item.platforms.length > 0 ? (
                      item.platforms.map(platform => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-400 bg-orange-500/10">
                        ⚠️ Missing Platforms
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm max-w-md">
                    {item.description.length > 150 
                      ? `${item.description.substring(0, 150)}...` 
                      : item.description
                    }
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="horror-button-outline"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                {/* Visibility Controls */}
                {showVisibilityControls && (
                  <>
                    {isHiddenContent ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShow?.(item.id)}
                        disabled={isShowing}
                        className="horror-button-outline"
                        title="Show content (make public)"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onHide?.(item.id)}
                        disabled={isHiding}
                        className="horror-button-outline"
                        title="Hide content from public"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeleting}
                      className="horror-button-outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="horror-bg border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Content</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete "{item.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="horror-button-outline">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
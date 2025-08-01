import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Loader2 } from "lucide-react";
import { z } from "zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import {
  CSS,
} from "@dnd-kit/utilities";

// Define the subgenre schema for form validation
const subgenreFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SubgenreFormData = z.infer<typeof subgenreFormSchema>;

interface Subgenre {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean | null;
  sortOrder: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function SubgenresManagement() {
  const { toast } = useToast();
  const [editingSubgenre, setEditingSubgenre] = useState<Subgenre | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch subgenres
  const { data: subgenres, isLoading } = useQuery({
    queryKey: ["/api/admin/subgenres"],
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create sorted subgenres array for drag and drop
  const sortedSubgenres = useMemo(() => {
    if (!subgenres) return [];
    return [...subgenres].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  }, [subgenres]);

  // Create items array for DndContext
  const items = useMemo(() => {
    return sortedSubgenres.map((subgenre) => subgenre.id);
  }, [sortedSubgenres]);

  // Handle drag end - reorder subgenres
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as number);
      const newIndex = items.indexOf(over.id as number);

      const newOrder = arrayMove(sortedSubgenres, oldIndex, newIndex);
      
      // Extract ordered IDs for the API call
      const orderedIds = newOrder.map(subgenre => subgenre.id);

      // Call API to update sort orders
      reorderSubgenresMutation.mutate(orderedIds);
    }
  };

  // Reorder subgenres mutation
  const reorderSubgenresMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      try {
        console.log("Attempting to reorder subgenres:", orderedIds);
        const response = await apiRequest("PUT", "/api/admin/subgenres/reorder", { orderedIds });
        console.log("Reorder successful");
        return response;
      } catch (error) {
        console.error("Reorder failed:", error);
        throw error;
      }
    },
    onMutate: async (orderedIds: number[]) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/admin/subgenres"] });

      // Snapshot the previous value
      const previousSubgenres = queryClient.getQueryData(["/api/admin/subgenres"]);

      // Optimistically update the cache with new order
      if (subgenres) {
        const optimisticSubgenres = orderedIds.map((id, index) => {
          const subgenre = subgenres.find(s => s.id === id);
          if (!subgenre) return null;
          return { ...subgenre, sortOrder: index + 1 };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
        
        queryClient.setQueryData(["/api/admin/subgenres"], optimisticSubgenres);
      }

      // Return a context object with the snapshotted value
      return { previousSubgenres };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subgenres"] });
      toast({
        title: "Success",
        description: "Subgenres reordered successfully",
      });
    },
    onError: (error: any, newData, context) => {
      console.error("Failed to reorder subgenres:", error);
      
      // Revert to previous state on error
      if (context?.previousSubgenres) {
        queryClient.setQueryData(["/api/admin/subgenres"], context.previousSubgenres);
      }
      
      // Check if it's an authentication error
      if (error?.status === 401 || error?.message?.includes('401')) {
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please refresh the page and log in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to reorder subgenres",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subgenres"] });
    },
  });

  // Create subgenre mutation
  const createSubgenreMutation = useMutation({
    mutationFn: (data: SubgenreFormData) => apiRequest("POST", "/api/admin/subgenres", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subgenres"] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Subgenre created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subgenre",
        variant: "destructive",
      });
    },
  });

  // Update subgenre mutation
  const updateSubgenreMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubgenreFormData> }) => 
      apiRequest("PATCH", `/api/admin/subgenres/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subgenres"] });
      setShowEditDialog(false);
      setEditingSubgenre(null);
      toast({
        title: "Success",
        description: "Subgenre updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subgenre",
        variant: "destructive",
      });
    },
  });

  // Delete subgenre mutation
  const deleteSubgenreMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/subgenres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subgenres"] });
      toast({
        title: "Success",
        description: "Subgenre deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subgenre",
        variant: "destructive",
      });
    },
  });

  // Form for creating subgenres
  const createForm = useForm<SubgenreFormData>({
    resolver: zodResolver(subgenreFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
    },
  });

  // Form for editing subgenres
  const editForm = useForm<SubgenreFormData>({
    resolver: zodResolver(subgenreFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
    },
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCreateSubmit = (data: SubgenreFormData) => {
    createSubgenreMutation.mutate(data);
  };

  const handleEditSubmit = (data: SubgenreFormData) => {
    if (editingSubgenre) {
      updateSubgenreMutation.mutate({ id: editingSubgenre.id, data });
    }
  };

  const handleEdit = (subgenre: Subgenre) => {
    setEditingSubgenre(subgenre);
    editForm.reset({
      name: subgenre.name,
      slug: subgenre.slug,
      description: subgenre.description || "",
      isActive: subgenre.isActive || false,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this subgenre? This action cannot be undone.")) {
      deleteSubgenreMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse" />
        <div className="h-32 bg-gray-800 rounded animate-pulse" />
        <div className="h-32 bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Subgenres Management</h2>
          <p className="text-gray-400">Manage horror subgenres for content categorization</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Subgenre
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Subgenre</DialogTitle>
              <DialogDescription>
                Add a new horror subgenre for categorizing content.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Psychological Horror"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-generate slug
                            const slug = generateSlug(e.target.value);
                            createForm.setValue("slug", slug);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., psychological-horror" />
                      </FormControl>
                      <FormDescription>
                        URL-friendly identifier (auto-generated from name)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Brief description of this subgenre..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Whether this subgenre is available for use
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createSubgenreMutation.isPending}>
                    {createSubgenreMutation.isPending ? "Creating..." : "Create Subgenre"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Drag and Drop Subgenres List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {sortedSubgenres?.map((subgenre: Subgenre) => (
              <SortableSubgenreCard 
                key={subgenre.id} 
                subgenre={subgenre} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            {sortedSubgenres?.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-8">
                  <p className="text-gray-400">No subgenres found. Create your first subgenre to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subgenre</DialogTitle>
            <DialogDescription>
              Update subgenre information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Psychological Horror"
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-generate slug
                          const slug = generateSlug(e.target.value);
                          editForm.setValue("slug", slug);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., psychological-horror" />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Brief description of this subgenre..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Whether this subgenre is available for use
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={updateSubgenreMutation.isPending}>
                  {updateSubgenreMutation.isPending ? "Updating..." : "Update Subgenre"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// SortableSubgenreCard component for drag and drop
interface SortableSubgenreCardProps {
  subgenre: Subgenre;
  onEdit: (subgenre: Subgenre) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

function SortableSubgenreCard({ subgenre, onEdit, onDelete, isDeleting }: SortableSubgenreCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subgenre.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 border-gray-700 ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing text-gray-500 hover:text-gray-300"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Subgenre Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-white truncate">
                {subgenre.name}
              </h3>
              <Badge
                variant={subgenre.isActive ? "default" : "secondary"}
                className={`text-xs ${subgenre.isActive ? 
                  'bg-green-600 hover:bg-green-700 text-white' : 
                  'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {subgenre.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              Slug: {subgenre.slug}
            </p>
            {subgenre.description && (
              <p className="text-xs text-gray-500 line-clamp-2">
                {subgenre.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(subgenre)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(subgenre.id)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
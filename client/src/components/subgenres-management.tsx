import { useRef, useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { z } from 'zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ----- Types that mirror the /api/admin/subgenres responses -----
interface Subgenre {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ----- Form schema (client-side) matches server expectations -----
const subgenreFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Max 50 characters'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(50, 'Max 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(1000, 'Max 1000 characters').optional().nullable(),
  isActive: z.boolean().default(true),
});
type SubgenreFormData = z.infer<typeof subgenreFormSchema>;

// ----- Component -----
export function SubgenresManagement() {
  const { toast } = useToast();
  const [editingSubgenre, setEditingSubgenre] = useState<Subgenre | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Track whether the user manually typed the slug (to stop auto-fill)
  const userEditedCreateSlug = useRef(false);
  const userEditedEditSlug = useRef(false);

  // Fetch subgenres (normalize result to an array to avoid "map is not a function")
  const { data: subgenres = [], isLoading } = useQuery<Subgenre[]>({
    queryKey: ['/api/admin/subgenres'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/subgenres');
      // Normalize: handle Response, {data: [...]}, or raw array
      let data: unknown = res;
      if (res && typeof res === 'object') {
        if ('json' in (res as any) && typeof (res as any).json === 'function') {
          data = await (res as any).json();
        } else if ('data' in (res as any)) {
          data = (res as any).data;
        }
      }
      return Array.isArray(data) ? (data as Subgenre[]) : [];
    },
    staleTime: 30_000,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sort by sortOrder for display
  const sortedSubgenres = useMemo(() => {
    const arr = Array.isArray(subgenres) ? subgenres : [];
    return [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [subgenres]);

  const items = useMemo(() => sortedSubgenres.map((s) => s.id), [sortedSubgenres]);

  // Optimistic reorder
  const reorderSubgenresMutation = useMutation({
    mutationFn: async (orderedIds: number[]) =>
      apiRequest('PUT', '/api/admin/subgenres/reorder', { orderedIds }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['/api/admin/subgenres'] });
      const previous = queryClient.getQueryData(['/api/admin/subgenres']);
      const prevArray: Subgenre[] = Array.isArray(previous) ? (previous as Subgenre[]) : [];

      if (prevArray.length) {
        const lookup = new Map(prevArray.map((s) => [s.id, s]));
        const optimistic = orderedIds
          .map((id, i) => {
            const s = lookup.get(id);
            return s ? { ...s, sortOrder: i + 1 } : null;
          })
          .filter(Boolean) as Subgenre[];
        queryClient.setQueryData(['/api/admin/subgenres'], optimistic);
      }

      return { previous };
    },
    onError: (err: any, _newData, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['/api/admin/subgenres'], ctx.previous);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to reorder subgenres. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Subgenres reordered successfully' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subgenres'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id as number);
    const newIndex = items.indexOf(over.id as number);
    const newOrder = arrayMove(sortedSubgenres, oldIndex, newIndex);
    const orderedIds = newOrder.map((s) => s.id);
    reorderSubgenresMutation.mutate(orderedIds);
  };

  // Create
  const createSubgenreMutation = useMutation({
    mutationFn: (data: SubgenreFormData) => apiRequest('POST', '/api/admin/subgenres', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subgenres'] });
      setShowCreateDialog(false);
      userEditedCreateSlug.current = false;
      toast({ title: 'Success', description: 'Subgenre created successfully' });
    },
    onError: (err: any) => {
      const msg =
        err?.status === 409
          ? 'Name or slug already exists'
          : err?.issues
            ? (err.issues as Array<{ message: string }>).map((i) => i.message).join(', ')
            : err?.message || 'Failed to create subgenre';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  // Update
  const updateSubgenreMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubgenreFormData> }) =>
      apiRequest('PATCH', `/api/admin/subgenres/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subgenres'] });
      setShowEditDialog(false);
      setEditingSubgenre(null);
      userEditedEditSlug.current = false;
      toast({ title: 'Success', description: 'Subgenre updated successfully' });
    },
    onError: (err: any) => {
      const msg =
        err?.status === 409
          ? 'Name or slug already exists'
          : err?.issues
            ? (err.issues as Array<{ message: string }>).map((i) => i.message).join(', ')
            : err?.message || 'Failed to update subgenre';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  // Delete
  const deleteSubgenreMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/subgenres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subgenres'] });
      toast({ title: 'Success', description: 'Subgenre deleted successfully' });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete subgenre',
        variant: 'destructive',
      });
    },
  });

  // Forms
  const createForm = useForm<SubgenreFormData>({
    resolver: zodResolver(subgenreFormSchema),
    defaultValues: { name: '', slug: '', description: '', isActive: true },
  });

  const editForm = useForm<SubgenreFormData>({
    resolver: zodResolver(subgenreFormSchema),
    defaultValues: { name: '', slug: '', description: '', isActive: true },
  });

  // Slug helper
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  const handleCreateSubmit = (data: SubgenreFormData) => {
    const payload = { ...data, description: data.description?.trim() || null };
    createSubgenreMutation.mutate(payload);
  };

  const handleEditSubmit = (data: SubgenreFormData) => {
    if (!editingSubgenre) return;
    const payload = { ...data, description: data.description?.trim() || null };
    updateSubgenreMutation.mutate({ id: editingSubgenre.id, data: payload });
  };

  const handleEdit = (subgenre: Subgenre) => {
    setEditingSubgenre(subgenre);
    editForm.reset({
      name: subgenre.name,
      slug: subgenre.slug,
      description: subgenre.description ?? '',
      isActive: subgenre.isActive,
    });
    userEditedEditSlug.current = false;
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this subgenre? This cannot be undone.')) {
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
      {/* Header + Create */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Subgenres Management</h2>
          <p className="text-gray-400">Manage horror subgenres for content categorization</p>
        </div>
        <Dialog
          open={showCreateDialog}
          onOpenChange={(o) => {
            setShowCreateDialog(o);
            if (!o) {
              userEditedCreateSlug.current = false;
              createForm.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Subgenre
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Subgenre</DialogTitle>
              <DialogDescription>Add a new horror subgenre.</DialogDescription>
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
                            if (!userEditedCreateSlug.current) {
                              createForm.setValue('slug', generateSlug(e.target.value), {
                                shouldValidate: true,
                              });
                            }
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
                        <Input
                          {...field}
                          placeholder="e.g., psychological-horror"
                          onChange={(e) => {
                            userEditedCreateSlug.current = true;
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormDescription>URL-friendly identifier</FormDescription>
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
                        <FormDescription>Whether this subgenre is available</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createSubgenreMutation.isPending}>
                    {createSubgenreMutation.isPending ? 'Creating...' : 'Create Subgenre'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List with Drag and Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {sortedSubgenres.map((sg) => (
              <SortableSubgenreCard
                key={sg.id}
                subgenre={sg}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deleteSubgenreMutation.isPending}
              />
            ))}
            {sortedSubgenres.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-8">
                  <p className="text-gray-400">No subgenres yet. Create your first one!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(o) => {
          setShowEditDialog(o);
          if (!o) setEditingSubgenre(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subgenre</DialogTitle>
            <DialogDescription>Update subgenre information.</DialogDescription>
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
                          if (!userEditedEditSlug.current) {
                            editForm.setValue('slug', generateSlug(e.target.value), {
                              shouldValidate: true,
                            });
                          }
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
                      <Input
                        {...field}
                        placeholder="e.g., psychological-horror"
                        onChange={(e) => {
                          userEditedEditSlug.current = true;
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>URL-friendly identifier</FormDescription>
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
                      <Textarea {...field} placeholder="Brief description..." />
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
                      <FormDescription>Whether this subgenre is available</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateSubgenreMutation.isPending}>
                  {updateSubgenreMutation.isPending ? 'Updating...' : 'Update Subgenre'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----- Sortable card -----
interface SortableSubgenreCardProps {
  subgenre: Subgenre;
  onEdit: (subgenre: Subgenre) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

function SortableSubgenreCard({
  subgenre,
  onEdit,
  onDelete,
  isDeleting,
}: SortableSubgenreCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subgenre.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-white truncate">{subgenre.name}</h3>
              <Badge
                variant={subgenre.isActive ? 'default' : 'secondary'}
                className={`text-xs ${
                  subgenre.isActive
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {subgenre.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-1">Slug: {subgenre.slug}</p>
            {subgenre.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{subgenre.description}</p>
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

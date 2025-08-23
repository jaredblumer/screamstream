import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EyeOff, Database, Search, X } from 'lucide-react';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { Content, InsertContent, Subgenre } from '@shared/schema';
import WatchmodeSync from '@/components/watchmode-sync';
import { SubgenresManagement } from '@/components/subgenres-management';
import { ContentFormDialog } from '@/components/admin/content-form-dialog';
import ContentPlatformsDialog from '@/components/admin/content-platforms-dialog';
import { ContentTable } from '@/components/admin/content-table';

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContentId, setDialogContentId] = useState<number>(0);
  const [dialogContentTitle, setDialogContentTitle] = useState<string | undefined>(undefined);

  const onEditPlatforms = (item: Content) => {
    setDialogContentId(item.id);
    setDialogContentTitle(item.title);
    setDialogOpen(true);
  };

  const fetchJSON = <T,>(url: string) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
      return r.json() as Promise<T>;
    });

  const { data: subgenres = [], isLoading: subgenresLoading } = useQuery<Subgenre[]>({
    queryKey: ['/api/admin/subgenres'],
    queryFn: () => fetchJSON<Subgenre[]>('/api/admin/subgenres'),
  });

  // Auth gate + admin check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: 'Unauthorized',
        description: 'Please sign in to access the admin panel.',
        variant: 'destructive',
      });
      setTimeout(() => (window.location.href = '/auth'), 500);
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Admin access required.',
        variant: 'destructive',
      });
      setTimeout(() => (window.location.href = '/'), 500);
    }
  }, [authLoading, isAuthenticated, user?.role, toast]);

  // Content queries
  const { data: content = [] } = useQuery<Content[]>({
    queryKey: ['/api/admin/content'],
    queryFn: () => fetchJSON<Content[]>('/api/admin/content'),
    retry: false,
  });

  const { data: inactiveContent = [] } = useQuery<Content[]>({
    queryKey: ['/api/admin/content/inactive'],
    queryFn: () => fetchJSON<Content[]>('/api/admin/content/inactive'),
    retry: false,
  });

  const { data: hiddenContent = [] } = useQuery<Content[]>({
    queryKey: ['/api/admin/content/hidden'],
    queryFn: () => fetchJSON<Content[]>('/api/admin/content/hidden'),
    retry: false,
  });

  const invalidateAllContentLists = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/content/inactive'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/content/hidden'] });
    queryClient.invalidateQueries({ queryKey: ['/api/content'] }); // public feed, if applicable
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: InsertContent) => {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content created successfully' });
      invalidateAllContentLists();
      setIsEditDialogOpen(false);
      setEditingContent(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => (window.location.href = '/auth'), 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to create content', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertContent> }) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content updated successfully' });
      invalidateAllContentLists();
      setIsEditDialogOpen(false);
      setEditingContent(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => (window.location.href = '/auth'), 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to update content', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content deleted successfully' });
      invalidateAllContentLists();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => (window.location.href = '/auth'), 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to delete content', variant: 'destructive' });
    },
  });

  const hideContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}/hide`, { method: 'POST' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content hidden from public display' });
      invalidateAllContentLists();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => (window.location.href = '/auth'), 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to hide content', variant: 'destructive' });
    },
  });

  const showContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}/show`, { method: 'POST' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content restored to public display' });
      invalidateAllContentLists();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => (window.location.href = '/auth'), 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to show content', variant: 'destructive' });
    },
  });

  const setActive = (id: number, next: boolean) =>
    updateMutation.mutate({ id, data: { active: next } });

  const movies = useMemo(() => content.filter((i) => i.type === 'movie'), [content]);
  const series = useMemo(() => content.filter((i) => i.type === 'series'), [content]);

  const openCreate = () => {
    setEditingContent(null);
    setIsEditDialogOpen(true);
  };

  const openEdit = (item: Content) => {
    setEditingContent(item);
    setIsEditDialogOpen(true);
  };

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
          <Button onClick={openCreate} className="horror-button-primary">
            + Add Content
          </Button>
        </div>

        <ContentFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          subgenres={subgenres}
          isSubgenresLoading={subgenresLoading}
          editingContent={editingContent}
          onCreate={(payload) => createMutation.mutate(payload)}
          onUpdate={(id, payload) => updateMutation.mutate({ id, data: payload })}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />

        <ContentPlatformsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contentId={dialogContentId}
          contentTitle={dialogContentTitle}
        />

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="horror-bg border-gray-700">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              All Content ({content.length})
            </TabsTrigger>
            <TabsTrigger
              value="movies"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              Movies ({movies.length})
            </TabsTrigger>
            <TabsTrigger
              value="series"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              Series ({series.length})
            </TabsTrigger>
            <TabsTrigger
              value="inactive"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              Inactive ({inactiveContent.length})
            </TabsTrigger>
            <TabsTrigger
              value="hidden"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              Hidden ({hiddenContent.length})
            </TabsTrigger>
            <TabsTrigger
              value="subgenres"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              Subgenres
            </TabsTrigger>
            <TabsTrigger
              value="watchmode"
              className="data-[state=active]:bg-red-800 data-[state=active]:text-white"
            >
              <Database className="w-4 h-4 mr-2" />
              Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ContentTable
              content={content}
              onEdit={openEdit}
              onDelete={(id) =>
                window.confirm('Delete this content? This action cannot be undone.') &&
                deleteMutation.mutate(id)
              }
              onHide={(id) => hideContentMutation.mutate(id)}
              onShow={(id) => showContentMutation.mutate(id)}
              onToggleActive={setActive}
              onEditPlatforms={onEditPlatforms}
              isDeleting={deleteMutation.isPending}
              isHiding={hideContentMutation.isPending}
              isShowing={showContentMutation.isPending}
              isTogglingActive={updateMutation.isPending}
              showVisibilityControls
            />
          </TabsContent>

          <TabsContent value="movies">
            <ContentTable
              content={movies}
              onEdit={openEdit}
              onDelete={(id) =>
                window.confirm('Delete this movie? This action cannot be undone.') &&
                deleteMutation.mutate(id)
              }
              onHide={(id) => hideContentMutation.mutate(id)}
              onShow={(id) => showContentMutation.mutate(id)}
              onToggleActive={setActive}
              onEditPlatforms={onEditPlatforms}
              isDeleting={deleteMutation.isPending}
              isHiding={hideContentMutation.isPending}
              isShowing={showContentMutation.isPending}
              isTogglingActive={updateMutation.isPending}
              showVisibilityControls
            />
          </TabsContent>

          <TabsContent value="series">
            <ContentTable
              content={series}
              onEdit={openEdit}
              onDelete={(id) =>
                window.confirm('Delete this series? This action cannot be undone.') &&
                deleteMutation.mutate(id)
              }
              onHide={(id) => hideContentMutation.mutate(id)}
              onShow={(id) => showContentMutation.mutate(id)}
              onToggleActive={setActive}
              onEditPlatforms={onEditPlatforms}
              isDeleting={deleteMutation.isPending}
              isHiding={hideContentMutation.isPending}
              isShowing={showContentMutation.isPending}
              isTogglingActive={updateMutation.isPending}
              showVisibilityControls
            />
          </TabsContent>

          <TabsContent value="inactive">
            <Card className="horror-bg border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <EyeOff className="w-5 h-5 mr-2" />
                  Inactive Content ({inactiveContent.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContentTable
                  content={inactiveContent}
                  onEdit={openEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onHide={(id) => hideContentMutation.mutate(id)}
                  onShow={(id) => showContentMutation.mutate(id)}
                  onToggleActive={setActive}
                  onEditPlatforms={onEditPlatforms}
                  isDeleting={deleteMutation.isPending}
                  isHiding={hideContentMutation.isPending}
                  isShowing={showContentMutation.isPending}
                  isTogglingActive={updateMutation.isPending}
                  showVisibilityControls
                />
              </CardContent>
            </Card>
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
                  onEdit={openEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onHide={(id) => hideContentMutation.mutate(id)}
                  onShow={(id) => showContentMutation.mutate(id)}
                  onToggleActive={setActive}
                  onEditPlatforms={onEditPlatforms}
                  isDeleting={deleteMutation.isPending}
                  isHiding={hideContentMutation.isPending}
                  isShowing={showContentMutation.isPending}
                  isTogglingActive={updateMutation.isPending}
                  showVisibilityControls
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchmode">
            <WatchmodeSync />
          </TabsContent>

          <TabsContent value="subgenres">
            <SubgenresManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

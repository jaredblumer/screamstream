import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Link as LinkIcon, Save, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PlatformBadge } from '@shared/schema';

type PlatformListItem = {
  id: number;
  platformKey: string;
  platformName: string;
  imageUrl: string | null;
  watchmodeId: number;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contentId: number;
  contentTitle?: string;
}

export default function ContentPlatformsDialog({
  open,
  onOpenChange,
  contentId,
  contentTitle,
}: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Existing platform links for this content
  const {
    data: badges = [],
    isLoading: isLoadingBadges,
    isFetching: isFetchingBadges,
  } = useQuery<PlatformBadge[]>({
    queryKey: ['/api/admin/content', contentId, 'platforms'],
    enabled: open && !!contentId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/content/${contentId}/platforms`);
      if (!res.ok) throw new Error('Failed to load content platforms');
      return res.json();
    },
  });

  // All platforms for dropdown (public route)
  const { data: allPlatforms = [], isLoading: isLoadingPlatforms } = useQuery<PlatformListItem[]>({
    queryKey: ['/platforms'],
    enabled: open,
    queryFn: async () => {
      const res = await fetch('/platforms');
      if (!res.ok) throw new Error('Failed to load platforms');
      return res.json();
    },
  });

  // Row edit state
  const [editUrls, setEditUrls] = useState<Record<number, string>>({}); // key: platformId (string URL)
  const [originalUrls, setOriginalUrls] = useState<Record<number, string>>({}); // to detect dirty

  useEffect(() => {
    if (badges) {
      const next: Record<number, string> = {};
      const orig: Record<number, string> = {};
      for (const b of badges) {
        const val = b.webUrl ?? '';
        next[b.platformId] = val;
        orig[b.platformId] = val;
      }
      setEditUrls(next);
      setOriginalUrls(orig);
    }
  }, [badges]);

  const existingPlatformIds = useMemo(() => new Set(badges.map((b) => b.platformId)), [badges]);

  // Helpers
  const normalizeUrl = (url: string) => {
    const t = url.trim();
    if (!t) return '';
    // prepend https if missing scheme and looks like a domain/path
    if (!/^https?:\/\//i.test(t)) {
      return `https://${t}`;
    }
    return t;
  };

  const isDirty = (platformId: number) =>
    (editUrls[platformId] ?? '') !== (originalUrls[platformId] ?? '');

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (payload: { platformId: number; webUrl: string }) => {
      const res = await fetch(`/api/admin/content/${contentId}/platforms/${payload.platformId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webUrl: payload.webUrl }),
      });
      if (!res.ok) throw new Error('Failed to update platform link');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Platform link updated' });
      qc.invalidateQueries({ queryKey: ['/api/admin/content', contentId, 'platforms'] });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.message || 'Could not save platform link',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (platformId: number) => {
      const res = await fetch(`/api/admin/content/${contentId}/platforms/${platformId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete platform link');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Removed', description: 'Platform removed from content' });
      qc.invalidateQueries({ queryKey: ['/api/admin/content', contentId, 'platforms'] });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.message || 'Could not remove platform',
        variant: 'destructive',
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { platformId: number; webUrl: string }) => {
      const res = await fetch(`/api/admin/content/${contentId}/platforms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add platform');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Added', description: 'Platform added to content' });
      setAddPlatformId(undefined);
      setAddUrl('');
      qc.invalidateQueries({ queryKey: ['/api/admin/content', contentId, 'platforms'] });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.message || 'Could not add platform',
        variant: 'destructive',
      });
    },
  });

  // Add row state
  const [addPlatformId, setAddPlatformId] = useState<number | undefined>(undefined);
  const [addUrl, setAddUrl] = useState('');

  const saveRow = (platformId: number) => {
    const normalized = normalizeUrl(editUrls[platformId] ?? '');
    setEditUrls((prev) => ({ ...prev, [platformId]: normalized }));
    updateMutation.mutate({ platformId, webUrl: normalized });
  };

  const removeRow = (platformId: number) => {
    if (!window.confirm('Remove this platform from the content?')) return;
    deleteMutation.mutate(platformId);
  };

  const addRow = () => {
    if (!addPlatformId) {
      toast({ title: 'Pick a platform', description: 'Select a platform to add.' });
      return;
    }
    const normalized = normalizeUrl(addUrl);
    addMutation.mutate({ platformId: addPlatformId, webUrl: normalized });
  };

  const anyLoading = isLoadingBadges || isLoadingPlatforms || isFetchingBadges;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="horror-bg border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            Edit Platforms{contentTitle ? ` — ${contentTitle}` : ''}
          </DialogTitle>
        </DialogHeader>

        {/* Existing rows */}
        <div className="space-y-4">
          {anyLoading ? (
            <div className="text-gray-400">Loading…</div>
          ) : badges.length === 0 ? (
            <div className="text-gray-400">No platforms yet.</div>
          ) : (
            badges.map((b) => {
              const url = editUrls[b.platformId] ?? '';
              const disabled =
                updateMutation.isPending || deleteMutation.isPending || !isDirty(b.platformId);
              return (
                <div
                  key={b.platformId}
                  className="grid grid-cols-[1fr_2fr_auto_auto] items-center gap-3"
                >
                  <div className="text-white">{b.platformName}</div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <Input
                      value={url}
                      onChange={(e) =>
                        setEditUrls((prev) => ({ ...prev, [b.platformId]: e.target.value }))
                      }
                      placeholder="https://example.com/watch/..."
                      className="horror-bg border-gray-700 text-white"
                    />
                    {url ? (
                      <a
                        href={normalizeUrl(url)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open link"
                        className="inline-flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ) : null}
                  </div>
                  <Button
                    onClick={() => saveRow(b.platformId)}
                    disabled={disabled}
                    className="horror-button-primary"
                    title={isDirty(b.platformId) ? 'Save changes' : 'No changes'}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => removeRow(b.platformId)}
                    disabled={deleteMutation.isPending}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-4" />

        {/* Add new platform */}
        <div className="space-y-2">
          <Label className="text-white">Add Platform</Label>
          <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-3">
            <Select
              value={addPlatformId ? String(addPlatformId) : undefined}
              onValueChange={(v) => setAddPlatformId(Number(v))}
            >
              <SelectTrigger className="horror-bg border-gray-700 text-white">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 text-white">
                {allPlatforms.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={String(p.id)}
                    disabled={existingPlatformIds.has(p.id)}
                  >
                    {p.platformName}
                    {existingPlatformIds.has(p.id) ? ' (added)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              placeholder="https://example.com/watch/..."
              className="horror-bg border-gray-700 text-white"
            />

            <Button
              onClick={addRow}
              className="horror-button-primary"
              disabled={addMutation.isPending || !addPlatformId}
            >
              + Add
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Tip: You usually only need <code>webUrl</code>. Leave it blank to store none.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="secondary"
            className="horror-button-secondary"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

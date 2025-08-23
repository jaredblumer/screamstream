import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X, Database } from 'lucide-react';
import type { Content, InsertContent, Subgenre } from '@shared/schema';
import { normalizeRating, intOrNull, calculateAverageRating } from '@/lib/content-form-utils';
import { apiRequest } from '@/lib/queryClient';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgenres: Subgenre[];
  isSubgenresLoading?: boolean;
  editingContent: Content | null;
  isSaving?: boolean;
  onCreate: (payload: InsertContent) => unknown | Promise<unknown>;
  onUpdate: (id: number, payload: Partial<InsertContent>) => unknown | Promise<unknown>;
};

type ContentFormData = {
  title: string;
  year: number;
  criticsRating: number | null;
  usersRating: number | null;
  description: string;
  posterUrl: string;
  // normalized UI state
  selectedSubgenreIds: number[];
  primarySubgenreId?: number | null;
  type: 'movie' | 'series';
  episodes?: number | null;
  seasons?: number | null;
  active: boolean;
  hidden: boolean;
};

const initialFormData: ContentFormData = {
  title: '',
  year: new Date().getFullYear(),
  criticsRating: null,
  usersRating: null,
  description: '',
  posterUrl: '',
  selectedSubgenreIds: [],
  primarySubgenreId: null,
  type: 'movie',
  episodes: null,
  seasons: null,
  active: false,
  hidden: true,
};

// --- helpers to normalize API shapes into subgenre IDs ---
function idsFromContentField(editingContent: any, subgenresById: Map<number, Subgenre>) {
  const out = new Set<number>();

  // If editingContent.subgenres exists, it may be strings (slugs) or objects
  const list = Array.isArray(editingContent?.subgenres) ? editingContent.subgenres : [];

  for (const item of list) {
    if (typeof item === 'number') {
      out.add(item);
    } else if (typeof item === 'string') {
      // map slug -> id
      const sg = [...subgenresById.values()].find((s) => s.slug === item);
      if (sg) out.add(sg.id);
    } else if (item && typeof item === 'object') {
      if (typeof item.id === 'number') out.add(item.id);
      else if (item.slug) {
        const sg = [...subgenresById.values()].find((s) => s.slug === item.slug);
        if (sg) out.add(sg.id);
      }
    }
  }
  return Array.from(out);
}

function idsFromEndpointPayload(payload: any, subgenresById: Map<number, Subgenre>) {
  const out = new Set<number>();
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'subgenres' in payload
      ? (payload as any).subgenres
      : [];

  for (const item of list ?? []) {
    if (typeof item === 'number') {
      out.add(item);
    } else if (typeof item === 'string') {
      const sg = [...subgenresById.values()].find((s) => s.slug === item);
      if (sg) out.add(sg.id);
    } else if (item && typeof item === 'object') {
      if (typeof item.id === 'number') out.add(item.id);
      else if (item.slug) {
        const sg = [...subgenresById.values()].find((s) => s.slug === item.slug);
        if (sg) out.add(sg.id);
      }
    }
  }
  return Array.from(out);
}

export function ContentFormDialog({
  open,
  onOpenChange,
  subgenres,
  isSubgenresLoading,
  editingContent,
  isSaving,
  onCreate,
  onUpdate,
}: Props) {
  const [formData, setFormData] = useState<ContentFormData>(initialFormData);
  const [loadingContentSubs, setLoadingContentSubs] = useState(false);

  const subgenresById = useMemo(
    () => new Map(subgenres.map((s) => [s.id, s] as const)),
    [subgenres]
  );

  // Populate when editing: pull subgenres from editingContent if present; otherwise GET endpoint
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!editingContent) {
        setFormData(initialFormData);
        return;
      }

      // Seed core fields from content row
      const basePrimary: number | null =
        (editingContent as any).primarySubgenreId ??
        (editingContent as any).primarySubgenre?.id ??
        null;

      // Try to get selected IDs from the editingContent itself first
      let selectedIds = idsFromContentField(editingContent, subgenresById);

      // If none found, fall back to the endpoint
      if (!selectedIds.length) {
        try {
          setLoadingContentSubs(true);
          const res = await apiRequest('GET', `/api/admin/content/${editingContent.id}/subgenres`);
          selectedIds = idsFromEndpointPayload(res, subgenresById);
        } catch {
          // ignore; keep as []
        } finally {
          setLoadingContentSubs(false);
        }
      }

      // Ensure uniqueness
      selectedIds = Array.from(new Set(selectedIds));

      // Primary must be one of the selected IDs.
      // If we have a primary that isn't selected, add it to the selection (so it's available).
      let nextPrimary = basePrimary;
      if (nextPrimary != null && !selectedIds.includes(nextPrimary)) {
        selectedIds.push(nextPrimary);
      }

      // If still no primary: pick the first selected or null if none.
      if (nextPrimary == null) {
        nextPrimary = selectedIds[0] ?? null;
      }

      if (cancelled) return;

      setFormData({
        title: editingContent.title,
        year: editingContent.year,
        seasons: editingContent.seasons ?? null,
        episodes: editingContent.episodes ?? null,
        criticsRating: editingContent.criticsRating ?? null,
        usersRating: editingContent.usersRating ?? null,
        description: editingContent.description,
        posterUrl: editingContent.posterUrl,
        type: editingContent.type,
        active: !!editingContent.active,
        hidden: !!editingContent.hidden,
        selectedSubgenreIds: selectedIds,
        primarySubgenreId: nextPrimary,
      });
    };

    // Only initialize when dialog opens or the item changes
    if (open) load();
  }, [editingContent?.id, open, subgenresById]); // depend on map so slug->id mapping is ready

  // Toggle a subgenre checkbox
  const toggleSubgenre = (id: number, checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.selectedSubgenreIds);
      if (checked) set.add(id);
      else set.delete(id);
      const ids = Array.from(set);

      let primary = prev.primarySubgenreId ?? null;
      // Keep primary valid: ensure it's always in ids
      if (ids.length === 0) {
        primary = null;
      } else if (primary == null || !ids.includes(primary)) {
        primary = ids[0];
      }

      return { ...prev, selectedSubgenreIds: ids, primarySubgenreId: primary };
    });
  };

  // Manually set the primary via the select (value comes in as string)
  const setPrimary = (value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    setFormData((prev) => {
      // If somehow not selected, add it (keeps invariant: primary ∈ selected)
      const set = new Set(prev.selectedSubgenreIds);
      if (!set.has(numeric)) set.add(numeric);
      return {
        ...prev,
        selectedSubgenreIds: Array.from(set),
        primarySubgenreId: numeric,
      };
    });
  };

  // Save
  const handleSubmit = async () => {
    const critics = normalizeRating(formData.criticsRating);
    const users = normalizeRating(formData.usersRating);
    const seasons = formData.type === 'series' ? intOrNull(formData.seasons) : null;
    const episodes = formData.type === 'series' ? intOrNull(formData.episodes) : null;

    // Safety: keep primary in sync with selection before submit
    let selected = Array.from(new Set(formData.selectedSubgenreIds));
    let primary = formData.primarySubgenreId ?? null;
    if (selected.length === 0) {
      primary = null;
    } else if (primary == null || !selected.includes(primary)) {
      primary = selected[0];
    }

    const payload: InsertContent = {
      title: formData.title.trim(),
      year: formData.year,
      criticsRating: critics,
      usersRating: users,
      averageRating: calculateAverageRating(critics, users),
      description: formData.description.trim(),
      posterUrl: formData.posterUrl.trim(),
      type: formData.type,
      seasons,
      episodes,
      active: !!formData.active,
      hidden: !!formData.hidden,
      primarySubgenreId: primary,
    } as InsertContent;

    if (editingContent) {
      await Promise.resolve(onUpdate(editingContent.id, payload));
      try {
        await apiRequest('PUT', `/api/admin/content/${editingContent.id}/subgenres`, {
          subgenreIds: selected,
          primarySubgenreId: primary,
        });
      } catch {
        // ignore; parent can refetch or show toast
      }
    } else {
      const created: any = await Promise.resolve(onCreate(payload));
      if (created && typeof created === 'object' && typeof created.id === 'number') {
        try {
          await apiRequest('PUT', `/api/admin/content/${created.id}/subgenres`, {
            subgenreIds: selected,
            primarySubgenreId: primary,
          });
        } catch {}
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="horror-bg border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingContent ? 'Edit Content' : 'Add New Content'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title / Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-white">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="horror-bg border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-white">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'movie' | 'series') =>
                  setFormData((p) => ({ ...p, type: value }))
                }
              >
                <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent className="horror-bg border-gray-700 horror-select-content">
                  <SelectItem value="movie" className="horror-select-item">
                    Movie
                  </SelectItem>
                  <SelectItem value="series" className="horror-select-item">
                    Series
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Series fields */}
          {formData.type === 'series' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seasons" className="text-white">
                  Seasons
                </Label>
                <Input
                  id="seasons"
                  value={formData.seasons ?? ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, seasons: parseInt(e.target.value) || null }))
                  }
                  className="horror-bg border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="episodes" className="text-white">
                  Episodes
                </Label>
                <Input
                  id="episodes"
                  value={formData.episodes ?? ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, episodes: parseInt(e.target.value) || null }))
                  }
                  className="horror-bg border-gray-700 text-white"
                />
              </div>
            </div>
          )}

          {/* Year + ratings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year" className="text-white">
                Year
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, year: parseInt(e.target.value || '0') }))
                }
                className="horror-bg border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="criticsRating" className="text-white">
                Critics Rating (0-10)
              </Label>
              <Input
                id="criticsRating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.criticsRating ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    criticsRating:
                      e.target.value === ''
                        ? null
                        : Math.min(10, Math.max(0, parseFloat(e.target.value))),
                  }))
                }
                className="horror-bg border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="usersRating" className="text-white">
                Users Rating (0-10)
              </Label>
              <Input
                id="usersRating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.usersRating ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    usersRating:
                      e.target.value === ''
                        ? null
                        : Math.min(10, Math.max(0, parseFloat(e.target.value))),
                  }))
                }
                className="horror-bg border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Subgenres (IDs) */}
          <div>
            <Label className="text-white">Subgenres (Select Multiple)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2 p-4 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {isSubgenresLoading || loadingContentSubs ? (
                <div className="text-gray-400">Loading subgenres…</div>
              ) : (
                subgenres.map((sg) => (
                  <div key={sg.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subgenre-${sg.id}`}
                      checked={formData.selectedSubgenreIds.includes(sg.id)}
                      onCheckedChange={(checked) => toggleSubgenre(sg.id, !!checked)}
                      className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label
                      htmlFor={`subgenre-${sg.id}`}
                      className="text-white text-sm cursor-pointer"
                    >
                      {sg.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Primary (ID) */}
          <div>
            <Label htmlFor="primarySubgenre" className="text-white">
              Primary Subgenre (Browse Display)
            </Label>
            <Select
              value={
                formData.primarySubgenreId &&
                formData.selectedSubgenreIds.includes(formData.primarySubgenreId)
                  ? String(formData.primarySubgenreId)
                  : ''
              }
              onValueChange={setPrimary}
            >
              <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue
                  placeholder="Select primary subgenre for browse pages"
                  className="text-white"
                />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                {formData.selectedSubgenreIds.map((id) => {
                  const s = subgenresById.get(id);
                  return (
                    <SelectItem key={id} value={String(id)} className="horror-select-item">
                      {s?.name ?? id}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              Primary must be one of the selected subgenres. It appears on browse pages.
            </p>
          </div>

          {/* Poster */}
          <div>
            <Label htmlFor="posterUrl" className="text-white">
              Poster URL
            </Label>
            <div className="space-y-2">
              <Input
                id="posterUrl"
                value={formData.posterUrl}
                onChange={(e) => setFormData((p) => ({ ...p, posterUrl: e.target.value }))}
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
                      const res = await fetch(
                        `/api/admin/content/${editingContent.id}/fix-poster`,
                        { method: 'POST' }
                      );
                      if (res.ok) {
                        const updated = await res.json();
                        setFormData((p) => ({ ...p, posterUrl: updated.posterUrl }));
                      } else {
                        throw new Error();
                      }
                    } catch {}
                  }}
                  className="text-xs horror-button-outline"
                  title="Attempt to find a better poster from TVDB"
                >
                  <Database className="w-3 h-3 mr-1" />
                  Fix with TVDB
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="horror-bg border-gray-700 text-white"
              rows={3}
            />
          </div>

          {/* Status / Hidden */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="active" className="text-white">
                Status
              </Label>
              <Select
                value={formData.active ? 'true' : 'false'}
                onValueChange={(v) => setFormData((p) => ({ ...p, active: v === 'true' }))}
              >
                <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                  <SelectValue placeholder="Select status" className="text-white" />
                </SelectTrigger>
                <SelectContent className="horror-bg border-gray-700 horror-select-content">
                  <SelectItem value="false" className="horror-select-item">
                    Inactive
                  </SelectItem>
                  <SelectItem value="true" className="horror-select-item">
                    Active
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hidden" className="text-white">
                Hidden
              </Label>
              <Select
                value={formData.hidden ? 'true' : 'false'}
                onValueChange={(v) => setFormData((p) => ({ ...p, hidden: v === 'true' }))}
              >
                <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                  <SelectValue placeholder="Select status" className="text-white" />
                </SelectTrigger>
                <SelectContent className="horror-bg border-gray-700 horror-select-content">
                  <SelectItem value="false" className="horror-select-item">
                    Not Hidden
                  </SelectItem>
                  <SelectItem value="true" className="horror-select-item">
                    Hidden
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="horror-button-outline"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!!isSaving} className="horror-button-primary">
              <Save className="w-4 h-4 mr-2" />
              {editingContent ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

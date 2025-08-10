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
import { useToast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgenres: Subgenre[];
  isSubgenresLoading?: boolean;
  editingContent: Content | null;
  isSaving?: boolean;
  onCreate: (payload: InsertContent) => void;
  onUpdate: (id: number, payload: InsertContent) => void;
};

type ContentFormData = {
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
  type: 'movie' | 'series';
};

const initialFormData: ContentFormData = {
  title: '',
  year: new Date().getFullYear(),
  rating: 0,
  criticsRating: 0,
  usersRating: 0,
  description: '',
  posterUrl: '',
  subgenres: [],
  primarySubgenre: '',
  platforms: [],
  platformLinks: [],
  type: 'movie',
};

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
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContentFormData>(initialFormData);

  // map available subgenre slugs (used in checkboxes/select)
  const availableSlugs = useMemo(() => subgenres.map((s: any) => s.slug), [subgenres]);

  useEffect(() => {
    if (editingContent) {
      const platforms = editingContent.platforms || [];
      const platformLinks = editingContent.platformLinks || [];
      const normalizedLinks = [...platformLinks];
      while (normalizedLinks.length < platforms.length) normalizedLinks.push('');

      setFormData({
        title: editingContent.title,
        year: editingContent.year,
        rating: editingContent.rating,
        criticsRating: editingContent.criticsRating ?? editingContent.rating,
        usersRating: editingContent.usersRating ?? 0,
        description: editingContent.description,
        posterUrl: editingContent.posterUrl,
        subgenres: editingContent.subgenres || [],
        primarySubgenre: editingContent.subgenre || '',
        platforms,
        platformLinks: normalizedLinks,
        type: editingContent.type,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingContent, open]);

  const handleSubmit = () => {
    const payload: InsertContent = {
      ...formData,
      subgenre:
        formData.primarySubgenre || (formData.subgenres.length > 0 ? formData.subgenres[0] : ''),
      platforms: formData.platforms,
      platformLinks: formData.platformLinks,
    };

    if (editingContent) {
      onUpdate(editingContent.id, payload);
    } else {
      onCreate(payload);
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
                value={formData.criticsRating.toFixed(1)}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    criticsRating: Math.round((parseFloat(e.target.value) || 0) * 10) / 10,
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
                value={formData.usersRating.toFixed(1)}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    usersRating: Math.round((parseFloat(e.target.value) || 0) * 10) / 10,
                  }))
                }
                className="horror-bg border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Subgenres (Select Multiple)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2 p-4 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {isSubgenresLoading ? (
                <div className="text-gray-400">Loading subgenres…</div>
              ) : (
                availableSlugs.map((slug) => (
                  <div key={slug} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subgenre-${slug}`}
                      checked={formData.subgenres.includes(slug)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => {
                            const newSubgenres = [...prev.subgenres, slug];
                            return {
                              ...prev,
                              subgenres: newSubgenres,
                              primarySubgenre:
                                newSubgenres.length === 1 ? newSubgenres[0] : prev.primarySubgenre,
                            };
                          });
                        } else {
                          setFormData((prev) => {
                            const newSubgenres = prev.subgenres.filter((s) => s !== slug);
                            return {
                              ...prev,
                              subgenres: newSubgenres,
                              primarySubgenre:
                                newSubgenres.length === 1
                                  ? newSubgenres[0]
                                  : prev.primarySubgenre === slug
                                    ? ''
                                    : prev.primarySubgenre,
                            };
                          });
                        }
                      }}
                      className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Label
                      htmlFor={`subgenre-${slug}`}
                      className="text-white text-sm cursor-pointer"
                    >
                      {slug}
                    </Label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Selected: {formData.subgenres.length > 0 ? formData.subgenres.join(', ') : 'None'}
            </p>
          </div>

          <div>
            <Label htmlFor="primarySubgenre" className="text-white">
              Primary Subgenre (Browse Display)
            </Label>
            <Select
              value={formData.primarySubgenre || ''}
              onValueChange={(value) => setFormData((p) => ({ ...p, primarySubgenre: value }))}
            >
              <SelectTrigger className="horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue
                  placeholder="Select primary subgenre for browse pages"
                  className="text-white"
                />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                {formData.subgenres.map((slug) => (
                  <SelectItem key={slug} value={slug} className="horror-select-item">
                    {slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              This subgenre will be displayed on browse pages. All selected subgenres appear on the
              details page.
            </p>
          </div>

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
                    } catch {
                      // Surface a friendly toast; avoid noisy console logs
                    }
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

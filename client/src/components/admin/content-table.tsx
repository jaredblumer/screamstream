import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { Content } from '@shared/schema';

type Props = {
  content: Content[];
  onEdit: (content: Content) => void;
  onDelete: (id: number) => void;
  onHide?: (id: number) => void;
  onShow?: (id: number) => void;
  onToggleActive?: (id: number, next: boolean) => void;
  isDeleting: boolean;
  isHiding?: boolean;
  isShowing?: boolean;
  isTogglingActive?: boolean;
  showVisibilityControls?: boolean;
  isHiddenContent?: boolean;
};

export function ContentTable({
  content,
  onEdit,
  onDelete,
  onHide,
  onShow,
  onToggleActive,
  isDeleting,
  isHiding,
  isShowing,
  isTogglingActive,
  showVisibilityControls = false,
  isHiddenContent = false,
}: Props) {
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <Badge variant="outline" className="border-red-800 text-red-400">
                      {item.type}
                    </Badge>
                    {'active' in item && (
                      <Badge
                        variant="outline"
                        className={
                          (item as any).active
                            ? 'border-green-600 text-green-400'
                            : 'border-gray-600 text-gray-300'
                        }
                        title={(item as any).active ? 'Active' : 'Inactive'}
                      >
                        {(item as any).active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                    {item.hidden && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                        Hidden
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.subgenres && item.subgenres.length > 0 ? (
                      item.subgenres.map((sg) => (
                        <Badge
                          key={sg}
                          variant="outline"
                          className="text-xs border-purple-500 text-purple-400"
                        >
                          {sg.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs border-yellow-500 text-yellow-400 bg-yellow-500/10"
                      >
                        Missing Subgenres
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm max-w-md">
                    {item.description.length > 150
                      ? `${item.description.substring(0, 150)}...`
                      : item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="horror-button-outline"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                {/* Active toggle as black bg / white text button */}
                {'active' in item && onToggleActive && (
                  <Button
                    size="sm"
                    disabled={!!isTogglingActive}
                    onClick={() => onToggleActive(item.id, !(item as any).active)}
                    title={(item as any).active ? 'Deactivate' : 'Activate'}
                    className="bg-black text-white border border-gray-700 hover:bg-black/80"
                  >
                    {(item as any).active ? 'Deactivate' : 'Activate'}
                  </Button>
                )}

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
                        Are you sure you want to delete "{item.title}"? This action cannot be
                        undone.
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

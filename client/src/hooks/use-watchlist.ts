import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { useWatchlistCount } from '@/contexts/WatchlistCountContext';

export function useWatchlist() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const { watchlistContent, refreshWatchlist } = useWatchlistCount();

  const watchlistIds = useMemo(() => watchlistContent.map((item) => item.id), [watchlistContent]);

  const requireAuth = (action: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign In Required',
        description: `Please sign in to ${action}.`,
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      return false;
    }
    return true;
  };

  const addToWatchlist = async (movieId: number) => {
    if (!requireAuth('add to watchlist')) return false;

    try {
      const response = await fetch(`/api/watchlist/${movieId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await refreshWatchlist();
        return true;
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    return false;
  };

  const removeFromWatchlist = async (movieId: number) => {
    if (!requireAuth('remove from watchlist')) return false;

    try {
      const response = await fetch(`/api/watchlist/${movieId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await refreshWatchlist();
        return true;
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
    return false;
  };

  const toggleWatchlist = async (movieId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to manage your watchlist.',
        variant: 'destructive',
      });

      return false;
    }

    const success = watchlistIds.includes(movieId)
      ? await removeFromWatchlist(movieId)
      : await addToWatchlist(movieId);

    return success;
  };

  const isInWatchlist = (movieId: number) => {
    return isAuthenticated && watchlistIds.includes(movieId);
  };

  const clearWatchlist = async () => {
    if (!requireAuth('clear your watchlist')) return;

    const results = await Promise.all(watchlistIds.map(removeFromWatchlist));
    if (results.every(Boolean)) {
      await refreshWatchlist();
    }
  };

  return {
    watchlistIds,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    clearWatchlist,
    watchlistCount: watchlistIds.length,
    isAuthenticated,
  };
}

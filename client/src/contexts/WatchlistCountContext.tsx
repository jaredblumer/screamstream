import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Content } from '@shared/schema';

interface WatchlistContextValue {
  watchlistContent: Content[];
  watchlistCount: number;
  refreshWatchlist: () => Promise<void>;
  isWatchlistLoading: boolean;
}

const WatchlistContext = createContext<WatchlistContextValue>({
  watchlistContent: [],
  watchlistCount: 0,
  refreshWatchlist: async () => {},
  isWatchlistLoading: false,
});

export function WatchlistCountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [watchlistContent, setWatchlistContent] = useState<Content[]>([]);
  const [isWatchlistLoading, setWatchlistLoading] = useState(false);

  const refreshWatchlist = async () => {
    if (!user) {
      setWatchlistContent([]);
      return;
    }

    try {
      setWatchlistLoading(true);
      const res = await fetch('/api/watchlist', { credentials: 'include' });
      if (res.ok) {
        const json: Content[] = await res.json();

        // Deduplicate by `id`
        const unique = Array.from(new Map(json.map((item) => [item.id, item])).values());
        setWatchlistContent(unique);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  useEffect(() => {
    refreshWatchlist();
  }, [user]);

  const watchlistCount = watchlistContent.length;

  return (
    <WatchlistContext.Provider
      value={{ watchlistContent, watchlistCount, refreshWatchlist, isWatchlistLoading }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlistCount() {
  return useContext(WatchlistContext);
}

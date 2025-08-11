import { Switch, Route, useLocation } from 'wouter';
import { useEffect } from 'react';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/use-auth';
import { WatchlistCountProvider } from './contexts/WatchlistCountContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { ProtectedRoute } from '@/lib/protected-route';
import Home from '@/pages/home';
import Subgenres from '@/pages/subgenres';
import NewToStreaming from '@/pages/new-to-streaming';
import Browse from '@/pages/browse';
import Search from '@/pages/search';
import Watchlist from '@/pages/watchlist';
import MovieDetail from '@/pages/movie-detail';
import Admin from '@/pages/admin';
import AuthPage from '@/pages/auth-page';
import NotFound from '@/pages/not-found';

function Router() {
  const [location] = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/subgenres" component={Subgenres} />
      <Route path="/new-to-streaming" component={NewToStreaming} />
      <Route path="/browse" component={Browse} />
      <Route path="/search" component={Search} />
      <Route path="/title/:id" component={MovieDetail} />
      <Route path="/watchlist" component={Watchlist} />
      <ProtectedRoute path="/admin" component={Admin} requiredRole="admin" />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WatchlistCountProvider>
          <TooltipProvider>
            <SearchProvider>
              <div className="min-h-screen horror-bg text-white">
                <Toaster />
                <Router />
              </div>
            </SearchProvider>
          </TooltipProvider>
        </WatchlistCountProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

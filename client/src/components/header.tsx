import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Menu, Skull, User, LogOut, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useWatchlistCount } from '@/contexts/WatchlistCountContext';
import { useSearch } from '@/contexts/SearchContext';

interface HeaderProps {
  autoFocusSearch?: boolean;
}

export default function Header({ autoFocusSearch }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { watchlistCount } = useWatchlistCount();
  const { query: searchQuery, setQuery } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch && inputRef.current) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(timeout);
    }
  }, [autoFocusSearch]);

  const navigation = [
    { name: 'Browse', href: '/browse', active: location === '/browse' },
    {
      name: 'New to Streaming',
      href: '/new-to-streaming',
      active: location === '/new-to-streaming',
    },
    { name: 'Subgenres', href: '/subgenres', active: location === '/subgenres' },
    {
      name: 'Watchlist',
      href: '/watchlist',
      active: location === '/watchlist',
      badge: watchlistCount > 0 ? watchlistCount : undefined,
    },
  ];

  const isOnSearchPage = location.startsWith('/search');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (!isOnSearchPage) {
      setLocation('/search');
      // Optional: reinforce caret after navigation (usually unnecessary now)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus());
      });
    }
  };

  const handleSearchBlur = () => setIsSearchFocused(false);

  return (
    <header className="dark-gray-bg border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center"
            onClick={() => {
              setQuery('');
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          >
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold blood-red flex items-center">
                <Skull className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                <span
                  className={`transition-all duration-300 overflow-hidden ${
                    isSearchFocused
                      ? 'w-0 opacity-0 md:w-auto md:opacity-100'
                      : 'w-auto opacity-100'
                  }`}
                >
                  <span className="whitespace-nowrap">Scream Stream</span>
                </span>
              </h1>
            </div>
          </Link>

          {/* Search Bar */}
          <div
            className={`transition-all duration-300 max-w-lg ${isSearchFocused ? 'flex-1 mx-1 sm:mx-4 md:mx-8' : 'flex-1 mx-2 sm:mx-4 md:mx-8'}`}
          >
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search horror titles..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="w-full horror-bg border-gray-700 text-white placeholder-gray-400 focus:border-red-600 focus:ring-red-600 pl-10 text-sm sm:text-base transition-all duration-300"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:block">
            <div className="flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setQuery('')}
                  className={`transition-colors flex text-center gap-2 ${item.active ? 'blood-red' : 'text-gray-300 hover:text-red-400'}`}
                >
                  {item.name}
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="bg-red-600 text-white text-xs min-w-5 h-5 flex items-center justify-center px-1"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button size="sm" className="horror-button-secondary">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="horror-button-outline"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button size="sm" className="horror-button-primary">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Nav */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="horror-button-ghost">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="horror-bg border-gray-800">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (['Top Rated', 'New to Streaming'].includes(item.name)) setQuery('');
                      }}
                      className="block"
                    >
                      <div
                        className={`flex items-center ${item.active ? 'blood-red' : 'text-gray-300 hover:text-red-400'}`}
                      >
                        <span className="text-lg">{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 bg-red-600 text-white text-xs font-semibold leading-none">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}

                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="horror-button-secondary mt-2">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        className="horror-button-outline mt-2"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logoutMutation.mutate();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth">
                      <Button
                        className="horror-button-primary mt-4"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Settings,
  Edit,
} from 'lucide-react';

interface SyncResult {
  newMoviesAdded: number;
  moviesValidated: number;
  moviesRemoved: number;
  requestsUsed: number;
  errors: string[];
  summary: string;
  titlesProcessed: Array<{
    title: string;
    year: number;
    action: 'added' | 'skipped_existing' | 'filtered_out' | 'error';
    reason?: string;
  }>;
  searchStats: {
    totalTitlesFound: number;
    pagesSearched: number;
    duplicatesSkipped: number;
    filteredOut: number;
  };
}

interface WatchmodeStatus {
  requestsUsed: number;
  requestsRemaining: number;
  monthlyLimit: number;
  error?: string;
}

const defaultPlatforms = ['Netflix', 'Amazon Prime', 'Hulu', 'HBO Max', 'Shudder'];

export default function WatchmodeSync() {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(defaultPlatforms);
  const [maxRequests, setMaxRequests] = useState(50);
  const [minRating, setMinRating] = useState(0.0);
  const [manualCount, setManualCount] = useState<string>('');

  // Get Watchmode API status
  const { data: status } = useQuery<WatchmodeStatus>({
    queryKey: ['/api/watchmode/status'],
  });

  // Get New to Streaming releases
  const newToStreamingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/sync-new-to-streaming');
      return await res.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: 'Streaming sync completed!',
        description: `Added ${result.newTitlesAdded} new titles, skipped ${result.duplicatesSkipped} duplicates`,
      });
      // Refresh content queries
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/new-to-streaming'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Streaming sync failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Manual API count update mutation
  const updateCountMutation = useMutation({
    mutationFn: async (count: number) => {
      const res = await apiRequest('PUT', '/api/admin/watchmode/usage', {
        requestsUsed: count,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'API count updated successfully',
        description: `Set Watchmode requests used to ${manualCount}`,
      });
      setManualCount('');
      // Refresh the status query
      queryClient.invalidateQueries({ queryKey: ['/api/watchmode/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Content sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      console.log('syncMutation');
      const res = await apiRequest('POST', '/api/content/sync', {
        maxRequests,
        selectedPlatforms,
        minRating,
      });
      console.log('syncMutation response:', res);
      return await res.json();
    },
    onSuccess: (result: SyncResult) => {
      toast({
        title: 'Sync completed!',
        description: result.summary,
      });
      // Refresh admin content after sync
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const availablePlatforms = [
    'Netflix',
    'Amazon Prime',
    'Hulu',
    'HBO Max',
    'Disney+',
    'Apple TV+',
    'Paramount+',
    'Peacock',
    'Shudder',
    'Tubi',
  ];

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    }
  };

  const handleUpdateCount = () => {
    const count = parseInt(manualCount, 10);
    if (isNaN(count) || count < 0 || count > 1000) {
      toast({
        title: 'Invalid count',
        description: 'Please enter a valid number between 0 and 1000',
        variant: 'destructive',
      });
      return;
    }
    updateCountMutation.mutate(count);
  };

  const progressPercentage = status
    ? Math.round((status.requestsUsed / status.monthlyLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Streaming Releases Sync Card */}
      <Card className="horror-bg border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            New Streaming Releases
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sync new horror releases from streaming platforms to the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-300">
            This will search for new horror releases from Netflix, Amazon Prime, Hulu, HBO Max, and
            Shudder from the last 30 days. Content will be validated for horror genres and stored in
            the database.
          </div>
          <Button
            onClick={() => newToStreamingMutation.mutate()}
            disabled={newToStreamingMutation.isPending}
            className="horror-button-primary w-full"
          >
            {newToStreamingMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {newToStreamingMutation.isPending ? 'Syncing...' : 'Sync New Streaming Releases'}
          </Button>
        </CardContent>
      </Card>

      {/* API Status Card */}
      <Card className="horror-bg border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Watchmode API Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Monthly request usage and remaining quota
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Requests Used</span>
                <span className="text-white font-medium">
                  {status.requestsUsed} / {status.monthlyLimit}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between">
                <Badge variant={status.requestsRemaining > 100 ? 'default' : 'destructive'}>
                  {status.requestsRemaining} remaining
                </Badge>
                <span className="text-xs text-gray-400">{progressPercentage}% used</span>
              </div>
              {status.error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {status.error}
                </div>
              )}

              {/* Manual API Count Update Section */}
              <div className="pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <h4 className="text-gray-300 font-medium">Manual Count Update</h4>
                </div>

                <p className="text-gray-400 text-sm mb-3">
                  Manually adjust the API request count for correcting tracking discrepancies.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="manual-count" className="text-gray-300 text-sm">
                      New Count
                    </Label>
                    <Input
                      id="manual-count"
                      type="number"
                      min="0"
                      max="1000"
                      value={manualCount}
                      onChange={(e) => setManualCount(e.target.value)}
                      className="horror-bg border-gray-700 text-white"
                      placeholder="Enter new count..."
                    />
                  </div>

                  <Button
                    onClick={handleUpdateCount}
                    disabled={
                      updateCountMutation.isPending ||
                      !manualCount ||
                      parseInt(manualCount) < 0 ||
                      parseInt(manualCount) > 1000
                    }
                    className="w-full horror-button-outline"
                  >
                    {updateCountMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating Count...
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Update API Count
                      </>
                    )}
                  </Button>

                  {updateCountMutation.data && (
                    <div className="bg-green-900/20 border border-green-700 p-2 rounded text-sm">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Count updated successfully
                      </div>
                    </div>
                  )}

                  {updateCountMutation.error && (
                    <div className="bg-red-900/20 border border-red-700 p-2 rounded text-sm">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {updateCountMutation.error.message || 'Failed to update count'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400">Loading API status...</div>
          )}
        </CardContent>
      </Card>

      {/* Sync Configuration Card */}
      <Card className="horror-bg border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure title sync preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Request Limit */}
          <div className="space-y-2">
            <Label htmlFor="max-requests" className="text-gray-300">
              Max API Requests ({maxRequests})
            </Label>
            <Input
              id="max-requests"
              type="range"
              min="1"
              max="200"
              value={maxRequests}
              onChange={(e) => setMaxRequests(parseInt(e.target.value))}
              className="horror-bg border-gray-700"
            />
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2">
            <Label htmlFor="min-rating" className="text-gray-300">
              Minimum Rating ({minRating === 0 ? 'No filter' : minRating})
            </Label>
            <Input
              id="min-rating"
              type="range"
              min="0.0"
              max="9.0"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="horror-bg border-gray-700"
            />
            <div className="text-xs text-gray-400">
              Set to 0 to include all titles regardless of rating
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label className="text-gray-300">Streaming Platforms</Label>
            <div className="grid grid-cols-2 gap-3">
              {availablePlatforms.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform}`}
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={(checked) =>
                      handlePlatformChange(platform, checked as boolean)
                    }
                  />
                  <Label htmlFor={`platform-${platform}`} className="text-gray-300 text-sm">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Button */}
          <div className="pt-4">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || selectedPlatforms.length === 0}
              className="w-full horror-button-primary"
            >
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Titles...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Sync Titles
                </>
              )}
            </Button>
          </div>

          {/* Sync Result */}
          {syncMutation.data && (
            <Card className="border-green-700 bg-green-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="space-y-3 w-full">
                    <h4 className="text-green-400 font-medium">Sync Completed</h4>

                    {/* Summary Stats */}
                    <div className="text-sm text-gray-300 space-y-1">
                      {syncMutation.data.newMoviesAdded > 0 && (
                        <div>• {syncMutation.data.newMoviesAdded} new titles added</div>
                      )}
                      {syncMutation.data.moviesValidated > 0 && (
                        <div>• {syncMutation.data.moviesValidated} titles validated</div>
                      )}
                      {syncMutation.data.moviesRemoved > 0 && (
                        <div>• {syncMutation.data.moviesRemoved} titles removed</div>
                      )}
                      <div>• {syncMutation.data.requestsUsed} API requests used</div>
                      {syncMutation.data.searchStats && (
                        <>
                          <div>
                            • {syncMutation.data.searchStats.totalTitlesFound} total titles found in{' '}
                            {syncMutation.data.searchStats.pagesSearched} pages
                          </div>
                          <div>
                            • {syncMutation.data.searchStats.duplicatesSkipped} duplicates skipped
                          </div>
                          <div>
                            • {syncMutation.data.searchStats.filteredOut} filtered out by criteria
                          </div>
                        </>
                      )}
                    </div>

                    {/* Detailed Title Processing */}
                    {syncMutation.data.titlesProcessed &&
                      syncMutation.data.titlesProcessed.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-gray-200 font-medium text-sm">Titles Processed:</h5>
                          <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                            {syncMutation.data.titlesProcessed.map((title, index) => (
                              <div
                                key={index}
                                className={`flex justify-between items-start gap-2 ${
                                  title.action === 'added'
                                    ? 'text-green-300'
                                    : title.action === 'skipped_existing'
                                      ? 'text-yellow-300'
                                      : title.action === 'filtered_out'
                                        ? 'text-orange-300'
                                        : 'text-red-300'
                                }`}
                              >
                                <span className="font-medium">
                                  {title.title} ({title.year})
                                </span>
                                {title.reason && (
                                  <span
                                    className="text-gray-400 text-xs truncate flex-shrink-0 max-w-48"
                                    title={title.reason}
                                  >
                                    {title.reason}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Errors Section */}
                    {syncMutation.data.errors.length > 0 && (
                      <div className="text-red-400 text-sm">
                        <div className="font-medium">Errors:</div>
                        {syncMutation.data.errors.slice(0, 3).map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                        {syncMutation.data.errors.length > 3 && (
                          <div>• And {syncMutation.data.errors.length - 3} more...</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

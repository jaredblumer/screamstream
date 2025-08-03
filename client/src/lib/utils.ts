import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Store platform images in a cache
let platformImagesCache: Record<string, string> = {};
let cacheLastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fallback logos for when admin hasn't set custom ones
const fallbackLogos: Record<string, string> = {
  netflix:
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32',
  hulu: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32',
  amazon_prime:
    'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32',
  hbo_max:
    'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32',
  disney_plus:
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32',
  paramount_plus:
    'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32',
};

async function loadPlatformImages(): Promise<void> {
  try {
    const response = await fetch('/api/admin/platform-images');
    if (response.ok) {
      const platformImages = await response.json();
      platformImagesCache = {};
      for (const image of platformImages) {
        if (image.isActive) {
          platformImagesCache[image.platformKey] = image.imageUrl;
        }
      }
      cacheLastUpdated = Date.now();
    }
  } catch (error) {
    console.warn('Failed to load platform images:', error);
  }
}

export function getPlatformLogo(platform: string): string {
  // Check if cache needs refresh
  const now = Date.now();
  if (now - cacheLastUpdated > CACHE_DURATION) {
    // Refresh cache in background
    loadPlatformImages();
  }

  // Return admin-configured image if available, otherwise fallback
  return platformImagesCache[platform] || fallbackLogos[platform] || fallbackLogos.netflix;
}

// Initialize cache on first load
if (typeof window !== 'undefined') {
  loadPlatformImages();
}

export function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    netflix: 'Netflix',
    hulu: 'Hulu',
    amazon_prime: 'Amazon Prime',
    hbo_max: 'HBO Max',
    disney_plus: 'Disney+',
    paramount_plus: 'Paramount+',
  };

  return names[platform] || platform;
}

export function formatSubgenre(subgenre: string | undefined | null): string {
  if (!subgenre) return '';

  return subgenre
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

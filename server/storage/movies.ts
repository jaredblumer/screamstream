import { getContent, getContentItem, createContent, updateContent, deleteContent } from './content';

import type { Movie, InsertMovie } from '@shared/schema';

export async function getMovies(filters?: {
  platform?: string;
  year?: number | string;
  minRating?: number;
  search?: string;
  sortBy?: 'rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
}): Promise<Movie[]> {
  const content = await getContent({ ...filters, type: 'movie' });
  return content as Movie[];
}

export async function getMovie(id: number): Promise<Movie | undefined> {
  const contentItem = await getContentItem(id);
  return contentItem?.type === 'movie' ? (contentItem as Movie) : undefined;
}

export async function createMovie(data: InsertMovie): Promise<Movie> {
  return (await createContent(data)) as Movie;
}

export async function updateMovie(
  id: number,
  updates: Partial<InsertMovie>
): Promise<Movie | undefined> {
  const updated = await updateContent(id, updates);
  return updated?.type === 'movie' ? (updated as Movie) : undefined;
}

export async function deleteMovie(id: number): Promise<boolean> {
  return deleteContent(id);
}

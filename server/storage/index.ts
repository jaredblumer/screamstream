import * as content from './content';
import * as users from './users';
import * as feedback from './feedback';
import * as watchlist from './watchlist';
import * as movies from './movies';
import * as usage from './usage';
import * as subgenres from './subgenres';
import * as platformImages from './platformImages';

export const storage = {
  ...content,
  ...users,
  ...feedback,
  ...watchlist,
  ...movies,
  ...usage,
  ...subgenres,
  ...platformImages,
};

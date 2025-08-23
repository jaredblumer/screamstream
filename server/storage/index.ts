import * as content from './content';
import * as users from './users';
import * as issues from './issues';
import * as watchlist from './watchlist';
import * as usage from './usage';
import * as subgenres from './subgenres';
import * as contentPlatforms from './content-platforms';

export const storage = {
  ...content,
  ...users,
  ...issues,
  ...watchlist,
  ...usage,
  ...subgenres,
  ...contentPlatforms,
};

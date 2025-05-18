import { configManager } from '../../platforms/cloudflare/configManager';
import { TMDBService } from '../../core/services/tmdbService';
import { logger } from '../../core/utils/logger';
import { loadUserTMDBApiKey } from './tmdbRoutes';

// Get TMDB popular movies catalog
export const getPopularMoviesCatalog = async (c: any) => {
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');

  try {
    // Load the user's API key
    const apiKey = await loadUserTMDBApiKey(userId);
    if (!apiKey) {
      return c.json(
        {
          error: 'TMDB API key not configured',
          message: 'Please configure your TMDB API key in the settings.',
        },
        403
      );
    }

    // Initialize TMDB service
    const tmdbService = new TMDBService(apiKey);

    // Fetch popular movies
    const response = await tmdbService.getPopularMovies(page);

    // Convert to catalog format
    const catalog = {
      id: 'tmdb-popular-movies',
      name: 'TMDB Popular Movies',
      type: 'movie',
      items: response.results.map(TMDBService.convertMovieToCatalogItem),
    };

    return c.json(catalog);
  } catch (error) {
    logger.error('Error fetching TMDB popular movies:', error);
    return c.json({ error: 'Failed to fetch popular movies' }, 500);
  }
};

// Get TMDB top rated movies catalog
export const getTopRatedMoviesCatalog = async (c: any) => {
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');

  try {
    // Load the user's API key
    const apiKey = await loadUserTMDBApiKey(userId);
    if (!apiKey) {
      return c.json(
        {
          error: 'TMDB API key not configured',
          message: 'Please configure your TMDB API key in the settings.',
        },
        403
      );
    }

    // Initialize TMDB service
    const tmdbService = new TMDBService(apiKey);

    // Fetch top rated movies
    const response = await tmdbService.getTopRatedMovies(page);

    // Convert to catalog format
    const catalog = {
      id: 'tmdb-top-rated-movies',
      name: 'TMDB Top Rated Movies',
      type: 'movie',
      items: response.results.map(TMDBService.convertMovieToCatalogItem),
    };

    return c.json(catalog);
  } catch (error) {
    logger.error('Error fetching TMDB top rated movies:', error);
    return c.json({ error: 'Failed to fetch top rated movies' }, 500);
  }
};

// Get TMDB popular TV series catalog
export const getPopularTVSeriesCatalog = async (c: any) => {
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');

  try {
    // Load the user's API key
    const apiKey = await loadUserTMDBApiKey(userId);
    if (!apiKey) {
      return c.json(
        {
          error: 'TMDB API key not configured',
          message: 'Please configure your TMDB API key in the settings.',
        },
        403
      );
    }

    // Initialize TMDB service
    const tmdbService = new TMDBService(apiKey);

    // Fetch popular TV series
    const response = await tmdbService.getPopularTVSeries(page);

    // Convert to catalog format
    const catalog = {
      id: 'tmdb-popular-series',
      name: 'TMDB Popular TV Series',
      type: 'series',
      items: response.results.map(TMDBService.convertSeriesToCatalogItem),
    };

    return c.json(catalog);
  } catch (error) {
    logger.error('Error fetching TMDB popular TV series:', error);
    return c.json({ error: 'Failed to fetch popular TV series' }, 500);
  }
};

// Get TMDB top rated TV series catalog
export const getTopRatedTVSeriesCatalog = async (c: any) => {
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');

  try {
    // Load the user's API key
    const apiKey = await loadUserTMDBApiKey(userId);
    if (!apiKey) {
      return c.json(
        {
          error: 'TMDB API key not configured',
          message: 'Please configure your TMDB API key in the settings.',
        },
        403
      );
    }

    // Initialize TMDB service
    const tmdbService = new TMDBService(apiKey);

    // Fetch top rated TV series
    const response = await tmdbService.getTopRatedTVSeries(page);

    // Convert to catalog format
    const catalog = {
      id: 'tmdb-top-rated-series',
      name: 'TMDB Top Rated TV Series',
      type: 'series',
      items: response.results.map(TMDBService.convertSeriesToCatalogItem),
    };

    return c.json(catalog);
  } catch (error) {
    logger.error('Error fetching TMDB top rated TV series:', error);
    return c.json({ error: 'Failed to fetch top rated TV series' }, 500);
  }
};

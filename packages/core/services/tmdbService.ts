import { logger } from '../utils/logger';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
}

interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export class TMDBService {
  private apiKey: string;
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('Error fetching from TMDB API:', error);
      throw error;
    }
  }

  async getPopularMovies(page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>(`/movie/popular?page=${page}`);
  }

  async getTopRatedMovies(page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>(`/movie/top_rated?page=${page}`);
  }

  async getPopularTVSeries(page: number = 1): Promise<TMDBResponse<TMDBSeries>> {
    return this.fetch<TMDBResponse<TMDBSeries>>(`/tv/popular?page=${page}`);
  }

  async getTopRatedTVSeries(page: number = 1): Promise<TMDBResponse<TMDBSeries>> {
    return this.fetch<TMDBResponse<TMDBSeries>>(`/tv/top_rated?page=${page}`);
  }

  // Helper method to convert TMDB movie to catalog item format
  static convertMovieToCatalogItem(movie: TMDBMovie) {
    return {
      id: `tmdb-movie-${movie.id}`,
      name: movie.title,
      type: 'movie',
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
      description: movie.overview,
      releaseInfo: movie.release_date,
      rating: movie.vote_average,
    };
  }

  // Helper method to convert TMDB series to catalog item format
  static convertSeriesToCatalogItem(series: TMDBSeries) {
    return {
      id: `tmdb-series-${series.id}`,
      name: series.name,
      type: 'series',
      poster: series.poster_path
        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
        : undefined,
      description: series.overview,
      releaseInfo: series.first_air_date,
      rating: series.vote_average,
    };
  }
}

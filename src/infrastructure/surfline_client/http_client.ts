import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  RatingResponse,
  TideResponse,
  SunlightResponse,
  WeatherResponse,
  SurfResponse,
  WindResponse,
  SpotResponse,
  SpotSearchResponse,
} from './types';
import { SurflineClient } from './surfline_client';

export class SurflineHttpClient implements SurflineClient {
  private httpClient: AxiosInstance;

  private accessToken: string | null = null;

  constructor() {
    this.httpClient = axios.create({
      baseURL: 'https://services.surfline.com',
    });
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      const response = await this.httpClient.post(
        '/trusted/token',
        {
          grant_type: 'password',
          username: email,
          password: password,
          forced: true,
          device_id: '',
          device_type: '',
          authorizationString:
            'Basic NWM1OWU3YzNmMGI2Y2IxYWQwMmJhZjY2OnNrX1FxWEpkbjZOeTVzTVJ1MjdBbWcz',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            isShortLived: false,
          },
        },
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.httpClient.defaults.headers.common['Authorization'] =
          `Bearer ${this.accessToken}`;
      } else {
        throw new Error('Login failed: No access token received.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error logging in:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error logging in:', error.message);
      } else {
        console.error('An unknown error occurred during login.');
      }
      throw new Error('Failed to login to Surfline.');
    }
  }

  public async getRatings(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<RatingResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get ratings.');
    }

    try {
      const response = await this.httpClient.get<RatingResponse>(
        '/kbyg/spots/forecasts/rating',
        {
          params: {
            spotId,
            days,
            intervalHours,
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching ratings:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching ratings:', error.message);
      } else {
        console.error('An unknown error occurred while fetching ratings.');
      }
      throw new Error('Failed to fetch ratings.');
    }
  }

  public async getTides(spotId: string, days: number): Promise<TideResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get tides.');
    }

    try {
      const response = await this.httpClient.get<TideResponse>(
        '/kbyg/spots/forecasts/tides',
        {
          params: {
            spotId,
            days,
            cacheEnabled: true,
            'units[tideHeight]': 'M',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching tides:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching tides:', error.message);
      } else {
        console.error('An unknown error occurred while fetching tides.');
      }
      throw new Error('Failed to fetch tides.');
    }
  }

  public async getSunlight(
    spotId: string,
    days: number,
  ): Promise<SunlightResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get sunlight data.');
    }

    try {
      const response = await this.httpClient.get<SunlightResponse>(
        '/kbyg/spots/forecasts/sunlight',
        {
          params: {
            spotId,
            days,
            intervalHours: 1,
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching sunlight data:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching sunlight data:', error.message);
      } else {
        console.error(
          'An unknown error occurred while fetching sunlight data.',
        );
      }
      throw new Error('Failed to fetch sunlight data.');
    }
  }

  public async getWeather(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<WeatherResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get weather data.');
    }

    try {
      const response = await this.httpClient.get<WeatherResponse>(
        '/kbyg/spots/forecasts/weather',
        {
          params: {
            spotId,
            days,
            intervalHours,
            cacheEnabled: true,
            'units[temperature]': 'C',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching weather data:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching weather data:', error.message);
      } else {
        console.error('An unknown error occurred while fetching weather data.');
      }
      throw new Error('Failed to fetch weather data.');
    }
  }

  public async getSurf(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<SurfResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get wave data.');
    }

    try {
      const response = await this.httpClient.get<SurfResponse>(
        '/kbyg/spots/forecasts/surf',
        {
          params: {
            spotId,
            days,
            intervalHours,
            corrected: true,
            'units[surfHeight]': 'FT',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching surf data:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching surf data:', error.message);
      } else {
        console.error('An unknown error occurred while fetching surf data.');
      }
      throw new Error('Failed to fetch surf data.');
    }
  }

  public async getWind(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<WindResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get wind data.');
    }

    try {
      const response = await this.httpClient.get<WindResponse>(
        '/kbyg/spots/forecasts/wind',
        {
          params: {
            spotId,
            days,
            intervalHours,
            corrected: true,
            'units[windSpeed]': 'KTS',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching wind data:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching wind data:', error.message);
      } else {
        console.error('An unknown error occurred while fetching wind data.');
      }
      throw new Error('Failed to fetch wind data.');
    }
  }

  public async getSpotInfo(spotId: string): Promise<SpotResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to get spot information.');
    }

    try {
      const response = await this.httpClient.get<any>('/kbyg/spots/details', {
        params: {
          spotId,
        },
      });

      // Handle the actual Surfline API response structure
      if (response.data && response.data.spot) {
        const spot = response.data.spot;
        return {
          _id: spotId, // Use the provided spotId since it's not in the response
          name: spot.name || `Unknown Spot ${spotId.slice(-4)}`,
          location: {
            coordinates: spot.location?.coordinates || [0, 0],
          },
        } as SpotResponse;
      }

      // Fallback if response structure is unexpected
      throw new Error('Unexpected response structure from Surfline API');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error fetching spot info:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error fetching spot info:', error.message);
      } else {
        console.error('An unknown error occurred while fetching spot info.');
      }
      throw new Error('Failed to fetch spot information.');
    }
  }

  public async searchSpots(query: string): Promise<SpotSearchResponse> {
    if (!this.accessToken) {
      throw new Error('You must be logged in to search spots.');
    }

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty.');
    }

    try {
      const response = await this.httpClient.get<any>('/kbyg/search/site', {
        params: {
          q: query.trim(),
          querySize: 10,
          suggestionSize: 10,
        },
      });

      // Handle the Surfline search API response structure
      // The API returns an array of search results, we need the first one which contains spots
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const spotSearchResult = response.data[0]; // First result contains spots
        
        if (spotSearchResult.hits && spotSearchResult.hits.hits) {
          const spots = spotSearchResult.hits.hits
            .map((hit: any) => {
              const source = hit._source;
              
              // Extract region and country from breadCrumbs
              const breadCrumbs = source.breadCrumbs || [];
              const country = breadCrumbs.length > 0 ? breadCrumbs[0] : undefined;
              const region = breadCrumbs.length > 2 ? breadCrumbs[2] : 
                           breadCrumbs.length > 1 ? breadCrumbs[1] : undefined;
              
              return {
                _id: hit._id,
                name: source.name || 'Unknown Spot',
                location: {
                  coordinates: [source.location?.lon || 0, source.location?.lat || 0] as [number, number],
                },
                region: region,
                country: country,
              };
            });

          return { spots };
        }
      }

      // Return empty results if no hits found
      return { spots: [] };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          'Error searching spots:',
          axiosError.response ? axiosError.response.data : axiosError.message,
        );
      } else if (error instanceof Error) {
        console.error('Error searching spots:', error.message);
      } else {
        console.error('An unknown error occurred while searching spots.');
      }
      throw new Error('Failed to search spots.');
    }
  }
}

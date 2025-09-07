import axios, { AxiosInstance, AxiosError } from 'axios';
import { RatingResponse, TideResponse, SunlightResponse, WeatherResponse, SurfResponse, WindResponse } from './types';
import { SurflineClient } from './surfline-client';

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
            const response = await this.httpClient.post('/trusted/token', {
                grant_type: 'password',
                username: email,
                password: password,
                forced: true,
                device_id: '',
                device_type: '',
                authorizationString: 'Basic NWM1OWU3YzNmMGI2Y2IxYWQwMmJhZjY2OnNrX1FxWEpkbjZOeTVzTVJ1MjdBbWcz',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                params: {
                    isShortLived: false,
                },
            });

            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
                console.log('Successfully logged in to Surfline.');
            } else {
                throw new Error('Login failed: No access token received.');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error logging in:', axiosError.response ? axiosError.response.data : axiosError.message);
            } else if (error instanceof Error) {
                console.error('Error logging in:', error.message);
            } else {
                console.error('An unknown error occurred during login.');
            }
            throw new Error('Failed to login to Surfline.');
        }
    }

    public async getRatings(spotId: string, days: number, intervalHours: number): Promise<RatingResponse> {
        if (!this.accessToken) {
            throw new Error('You must be logged in to get ratings.');
        }

        try {
            const response = await this.httpClient.get<RatingResponse>('/kbyg/spots/forecasts/rating', {
                params: {
                    spotId,
                    days,
                    intervalHours,
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error fetching ratings:', axiosError.response ? axiosError.response.data : axiosError.message);
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
            const response = await this.httpClient.get<TideResponse>('/kbyg/spots/forecasts/tides', {
                params: {
                    spotId,
                    days,
                    cacheEnabled: true,
                    'units[tideHeight]': 'M',
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error fetching tides:', axiosError.response ? axiosError.response.data : axiosError.message);
            } else if (error instanceof Error) {
                console.error('Error fetching tides:', error.message);
            } else {
                console.error('An unknown error occurred while fetching tides.');
            }
            throw new Error('Failed to fetch tides.');
        }
    }

    public async getSunlight(spotId: string, days: number): Promise<SunlightResponse> {
        if (!this.accessToken) {
            throw new Error('You must be logged in to get sunlight data.');
        }

        try {
            const response = await this.httpClient.get<SunlightResponse>('/kbyg/spots/forecasts/sunlight', {
                params: {
                    spotId,
                    days,
                    intervalHours: 1,
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error fetching sunlight data:', axiosError.response ? axiosError.response.data : axiosError.message);
            } else if (error instanceof Error) {
                console.error('Error fetching sunlight data:', error.message);
            } else {
                console.error('An unknown error occurred while fetching sunlight data.');
            }
            throw new Error('Failed to fetch sunlight data.');
        }
    }

    public async getWeather(spotId: string, days: number, intervalHours: number): Promise<WeatherResponse> {
        if (!this.accessToken) {
            throw new Error('You must be logged in to get weather data.');
        }

        try {
            const response = await this.httpClient.get<WeatherResponse>('/kbyg/spots/forecasts/weather', {
                params: {
                    spotId,
                    days,
                    intervalHours,
                    cacheEnabled: true,
                    'units[temperature]': 'C',
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error fetching weather data:', axiosError.response ? axiosError.response.data : axiosError.message);
            } else if (error instanceof Error) {
                console.error('Error fetching weather data:', error.message);
            } else {
                console.error('An unknown error occurred while fetching weather data.');
            }
            throw new Error('Failed to fetch weather data.');
        }
    }

    public async getSurf(spotId: string, days: number, intervalHours: number): Promise<SurfResponse> {
        if (!this.accessToken) {
            throw new Error('You must be logged in to get wave data.');
        }

        try {
            const response = await this.httpClient.get<SurfResponse>('/kbyg/spots/forecasts/surf', {
                params: {
                    spotId,
                    days,
                    intervalHours,
                    corrected: true,
                    'units[surfHeight]': 'FT',
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error fetching surf data:', axiosError.response ? axiosError.response.data : axiosError.message);
            } else if (error instanceof Error) {
                console.error('Error fetching surf data:', error.message);
            } else {
                console.error('An unknown error occurred while fetching surf data.');
            }
            throw new Error('Failed to fetch surf data.');
        }
    }

    public async getWind(spotId: string, days: number, intervalHours: number): Promise<WindResponse> {
        if (!this.accessToken) {
            throw new Error('You must be logged in to get wind data.');
        }

        try {
            const response = await this.httpClient.get<WindResponse>('/kbyg/spots/forecasts/wind', {
                params: {
                    spotId,
                    days,
                    intervalHours,
                    corrected: true,
                    'units[windSpeed]': 'KTS',
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Error fetching wind data:', axiosError.response ? axiosError.response.data : axiosError.message);
            } else if (error instanceof Error) {
                console.error('Error fetching wind data:', error.message);
            } else {
                console.error('An unknown error occurred while fetching wind data.');
            }
            throw new Error('Failed to fetch wind data.');
        }
    }
}

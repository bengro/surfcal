import { Rating, RatingResponse, Sunlight, SunlightResponse, TideResponse, Wave, WaveResponse, WeatherResponse, WindResponse } from './types';
import { SurflineClient } from './surfline-client';

export class SurflineFakeClient implements SurflineClient {
    private static readonly RATING_RESPONSE: RatingResponse = {
        associated: {
            location: { lon: 0, lat: 0 },
            runInitializationTimestamp: 1672531200,
        },
        data: {
            rating: [
                { timestamp: 1672531200, utcOffset: 0, rating: { key: 'GOOD', value: 4 } },
                { timestamp: 1672534800, utcOffset: 0, rating: { key: 'FAIR', value: 3 } },
            ],
        },
    };

    private static readonly TIDE_RESPONSE: TideResponse = {
        associated: {
            utcOffset: 0,
            units: { tideHeight: 'M' },
            tideLocation: { name: 'Test Spot', min: 0, max: 2, lon: 0, lat: 0, mean: 1 },
        },
        data: {
            tides: [
                { timestamp: 1672531200, utcOffset: 0, type: 'HIGH', height: 1.8 },
                { timestamp: 1672552800, utcOffset: 0, type: 'LOW', height: 0.4 },
            ],
        },
    };

    private static readonly SUNLIGHT_RESPONSE: SunlightResponse = {
        associated: {
            location: { lon: 0, lat: 0 },
            runInitializationTimestamp: 1672531200,
        },
        data: {
            sunlight: [
                {
                    midnight: 1672531200,
                    midnightUTCOffset: 0,
                    dawn: 1672552800,
                    dawnUTCOffset: 0,
                    sunrise: 1672556400,
                    sunriseUTCOffset: 0,
                    sunset: 1672596000,
                    sunsetUTCOffset: 0,
                    dusk: 1672599600,
                    duskUTCOffset: 0,
                },
            ],
        },
    };

    private static readonly WEATHER_RESPONSE: WeatherResponse = {
        associated: {
            units: { temperature: 'C' },
            utcOffset: 0,
            weatherIconPath: '',
            runInitializationTimestamp: 1672531200,
        },
        data: {
            sunlightTimes: [],
            weather: [
                { timestamp: 1672531200, utcOffset: 0, temperature: 22, condition: 'CLEAR', pressure: 1012 },
                { timestamp: 1672534800, utcOffset: 0, temperature: 21, condition: 'CLEAR', pressure: 1013 },
            ],
        },
        permissions: {
            data: [],
            violations: [],
        },
    };

    private static readonly WAVE_RESPONSE: WaveResponse = {
        associated: {
            location: { lon: 0, lat: 0 },
            runInitializationTimestamp: 1672531200,
        },
        data: {
            wave: [
                { timestamp: 1672531200, utcOffset: 0, surf: { min: 1.5, max: 2.5, optimalScore: 4 }, swells: [] },
                { timestamp: 1672534800, utcOffset: 0, surf: { min: 1.4, max: 2.4, optimalScore: 3 }, swells: [] },
            ],
        },
    };

    private static readonly WIND_RESPONSE: WindResponse = {
        associated: {
            location: { lon: 0, lat: 0 },
            runInitializationTimestamp: 1672531200,
        },
        data: {
            wind: [
                { timestamp: 1672531200, utcOffset: 0, speed: 12, direction: 180, directionType: 'ONSHORE', gust: 18, optimalScore: 2 },
                { timestamp: 1672534800, utcOffset: 0, speed: 10, direction: 190, directionType: 'ONSHORE', gust: 15, optimalScore: 3 },
            ],
        },
    };

    private ratingResponse: RatingResponse = SurflineFakeClient.RATING_RESPONSE;
    private sunlightResponse: SunlightResponse = SurflineFakeClient.SUNLIGHT_RESPONSE;
    private waveResponse: WaveResponse = SurflineFakeClient.WAVE_RESPONSE;

    private loggedIn = false;

    public setRatings(ratings: Rating[]): void {
        this.ratingResponse = {
            ...SurflineFakeClient.RATING_RESPONSE,
            data: {
                rating: ratings,
            },
        };
    }

    public setSunlight(sunlight: Sunlight[]): void {
        this.sunlightResponse = {
            ...SurflineFakeClient.SUNLIGHT_RESPONSE,
            data: {
                sunlight: sunlight,
            },
        };
    }

    public setWave(wave: Wave[]): void {
        this.waveResponse = {
            ...SurflineFakeClient.WAVE_RESPONSE,
            data: {
                wave: wave,
            },
        };
    }

    public async login(email: string, password: string): Promise<void> {
        if (email && password) {
            this.loggedIn = true;
        } else {
            throw new Error('FakeSurflineClient: Login failed.');
        }
    }

    private checkLogin(): void {
        if (!this.loggedIn) {
            throw new Error('You must be logged in.');
        }
    }

    public async getRatings(spotId: string, days: number, intervalHours: number): Promise<RatingResponse> {
        this.checkLogin();
        return this.ratingResponse;
    }

    public async getTides(spotId: string, days: number): Promise<TideResponse> {
        this.checkLogin();
        return SurflineFakeClient.TIDE_RESPONSE;
    }

    public async getSunlight(spotId: string, days: number): Promise<SunlightResponse> {
        this.checkLogin();
        return this.sunlightResponse;
    }

    public async getWeather(spotId: string, days: number, intervalHours: number): Promise<WeatherResponse> {
        this.checkLogin();
        return SurflineFakeClient.WEATHER_RESPONSE;
    }

    public async getWave(spotId: string, days: number, intervalHours: number): Promise<WaveResponse> {
        this.checkLogin();
        return this.waveResponse;
    }

    public async getWind(spotId: string, days: number, intervalHours: number): Promise<WindResponse> {
        this.checkLogin();
        return SurflineFakeClient.WIND_RESPONSE;
    }
}

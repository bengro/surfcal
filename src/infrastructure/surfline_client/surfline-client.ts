import {
  RatingResponse,
  TideResponse,
  SunlightResponse,
  WeatherResponse,
  SurfResponse,
  WindResponse,
} from './types';

export interface SurflineClient {
  login(email: string, password: string): Promise<void>;
  getRatings(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<RatingResponse>;
  getTides(spotId: string, days: number): Promise<TideResponse>;
  getSunlight(spotId: string, days: number): Promise<SunlightResponse>;
  getWeather(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<WeatherResponse>;
  getSurf(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<SurfResponse>;
  getWind(
    spotId: string,
    days: number,
    intervalHours: number,
  ): Promise<WindResponse>;
}

export interface Location {
  lon: number;
  lat: number;
}

export interface Associated {
  location: Location;
  runInitializationTimestamp: number;
}

export interface RatingInfo {
  key: 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR_TO_FAIR' | 'POOR' | 'VERY_POOR';
  value: number;
}

export interface Rating {
  timestamp: number;
  utcOffset: number;
  rating: RatingInfo;
}

export interface RatingData {
  rating: Rating[];
}

export interface RatingResponse {
  associated: Associated;
  data: RatingData;
}

export interface Tide {
  timestamp: number;
  utcOffset: number;
  type: string;
  height: number;
}

export interface TideData {
  tides: Tide[];
}

export interface TideAssociated {
  utcOffset: number;
  units: {
    tideHeight: string;
  };
  tideLocation: {
    name: string;
    min: number;
    max: number;
    lon: number;
    lat: number;
    mean: number;
  };
}

export interface TideResponse {
  associated: TideAssociated;
  data: TideData;
}

export interface Sunlight {
  midnight: number;
  midnightUTCOffset: number;
  dawn: number;
  dawnUTCOffset: number;
  sunrise: number;
  sunriseUTCOffset: number;
  sunset: number;
  sunsetUTCOffset: number;
  dusk: number;
  duskUTCOffset: number;
}

export interface SunlightData {
  sunlight: Sunlight[];
}

export interface SunlightResponse {
  associated: Associated;
  data: SunlightData;
}

export interface WeatherResponse {
  associated: WeatherAssociated;
  data: Data;
  permissions: Permissions;
}

export interface WeatherAssociated {
  units: Units;
  utcOffset: number;
  weatherIconPath: string;
  runInitializationTimestamp: number;
}

export interface Units {
  temperature: string;
}

export interface Data {
  sunlightTimes: SunlightTime[];
  weather: Weather[];
}

export interface SunlightTime {
  midnight: number;
  midnightUTCOffset: number;
  dawn: number;
  dawnUTCOffset: number;
  sunrise: number;
  sunriseUTCOffset: number;
  sunset: number;
  sunsetUTCOffset: number;
  dusk: number;
  duskUTCOffset: number;
}

export interface Weather {
  timestamp: number;
  utcOffset: number;
  temperature: number;
  condition: string;
  pressure: number;
}

export interface Permissions {
  data: Datum[];
  violations: any[];
}

export interface Datum {
  name: string;
  resource: string;
  resourceType: string;
  role: string;
}

export interface Swell {
  height: number;
  period: number;
  direction: number;
  directionMin: number;
  optimalScore: number;
}

export interface SurfResponse {
  associated: Associated;
  data: {
    surf: SurfData[];
  };
}

export interface SurfData {
  timestamp: number;
  utcOffset: number;
  surf: Wave;
}

export interface Wave {
  min: number;
  max: number;
  plus: false;
  humanRelation: string;
  raw: {
    min: number;
    max: number;
  };
}

export interface WindResponse {
  associated: Associated;
  data: WindData;
}

export interface WindData {
  wind: Wind[];
}

export interface Wind {
  timestamp: number;
  utcOffset: number;
  speed: number;
  direction: number;
  directionType: string;
  gust: number;
  optimalScore: number;
}

export interface SpotInfo {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
}

export interface SpotResponse {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
}

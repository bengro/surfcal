export interface SurfableHour {
  startTime: number;
  endTime: number;
  spotId: string;
  condition: string;
  waveHeight: number;
  windSpeed: number; // in mph or km/h depending on API
  windDirection: number; // in degrees (0-360)
  windDirectionType: string; // e.g., "onshore", "offshore", "cross-shore"
  calendarConflict?: boolean; // Optional field to mark calendar conflicts
}

export interface SurfCriteria {
  minWaveHeight: number; // in feet
  minRating:
    | 'VERY_POOR'
    | 'POOR'
    | 'POOR_TO_FAIR'
    | 'FAIR'
    | 'GOOD'
    | 'VERY_GOOD';
}

export const DEFAULT_SURF_CRITERIA: SurfCriteria = {
  minWaveHeight: 2,
  minRating: 'POOR_TO_FAIR',
};

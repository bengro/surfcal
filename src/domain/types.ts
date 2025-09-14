export interface SurfableHour {
  startTime: number;
  endTime: number;
  spotId: string;
  condition: string;
  waveHeight: number;
  calendarConflict?: boolean; // Optional field to mark calendar conflicts
}

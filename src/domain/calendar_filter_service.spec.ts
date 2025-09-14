import { CalendarFilterService } from './calendar_filter_service';
import { SurfableHour } from './types';
import { TimeSlot } from '../infrastructure/google_calendar_client/types';

describe('CalendarFilterService', () => {
  const createSurfableHour = (
    startTime: string,
    endTime: string,
    spotId: string = 'test-spot',
  ): SurfableHour => ({
    startTime: new Date(startTime).getTime() / 1000,
    endTime: new Date(endTime).getTime() / 1000,
    spotId,
    condition: 'Fair',
    waveHeight: 3,
  });

  const createTimeSlot = (start: string, end: string): TimeSlot => ({
    start: new Date(start),
    end: new Date(end),
  });

  describe('markCalendarConflicts', () => {
    it('should return all surfable hours without conflicts when no busy slots are provided', () => {
      const surfableHours = [
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T12:00:00.000Z',
        ),
      ];
      const busySlots: TimeSlot[] = [];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(1);
      expect(result[0].calendarConflict).toBe(false);
    });

    it('should mark surfable hours that conflict with busy slots', () => {
      const surfableHours = [
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T12:00:00.000Z',
        ),
        createSurfableHour(
          '2025-01-15T14:00:00.000Z',
          '2025-01-15T16:00:00.000Z',
        ),
      ];
      const busySlots = [
        createTimeSlot('2025-01-15T11:00:00.000Z', '2025-01-15T13:00:00.000Z'), // Overlaps with first surfable hour
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(2);
      expect(result[0].calendarConflict).toBe(true); // First hour conflicts
      expect(result[1].calendarConflict).toBe(false); // Second hour is free
    });

    it('should mark surfable hours that partially overlap with busy slots', () => {
      const surfableHours = [
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T14:00:00.000Z',
        ), // Partially overlaps with busy slot
      ];
      const busySlots = [
        createTimeSlot('2025-01-15T12:00:00.000Z', '2025-01-15T16:00:00.000Z'), // Overlaps from 12:00-14:00
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(1);
      expect(result[0].calendarConflict).toBe(true);
    });

    it('should handle exact time boundaries correctly', () => {
      const surfableHours = [
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T12:00:00.000Z',
        ),
        createSurfableHour(
          '2025-01-15T12:00:00.000Z',
          '2025-01-15T14:00:00.000Z',
        ), // Starts exactly when busy slot ends
      ];
      const busySlots = [
        createTimeSlot('2025-01-15T10:00:00.000Z', '2025-01-15T12:00:00.000Z'), // Exact same time as first surfable hour
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(2);
      expect(result[0].calendarConflict).toBe(true); // First hour conflicts exactly
      expect(result[1].calendarConflict).toBe(false); // Second hour starts when busy slot ends
    });

    it('should handle multiple busy slots and mark conflicts accordingly', () => {
      const surfableHours = [
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T11:00:00.000Z',
        ),
        createSurfableHour(
          '2025-01-15T14:00:00.000Z',
          '2025-01-15T15:00:00.000Z',
        ),
        createSurfableHour(
          '2025-01-15T18:00:00.000Z',
          '2025-01-15T19:00:00.000Z',
        ),
      ];
      const busySlots = [
        createTimeSlot('2025-01-15T10:30:00.000Z', '2025-01-15T11:30:00.000Z'), // Overlaps with first hour
        createTimeSlot('2025-01-15T18:30:00.000Z', '2025-01-15T19:30:00.000Z'), // Overlaps with third hour
        // Second hour is free
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(3);
      expect(result[0].calendarConflict).toBe(true); // First hour conflicts
      expect(result[1].calendarConflict).toBe(false); // Second hour is free
      expect(result[2].calendarConflict).toBe(true); // Third hour conflicts
    });

    it('should handle empty surfable hours array', () => {
      const surfableHours: SurfableHour[] = [];
      const busySlots = [
        createTimeSlot('2025-01-15T09:00:00.000Z', '2025-01-15T12:00:00.000Z'),
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toEqual([]);
    });

    it('should preserve all surfable hour properties and add conflict flag', () => {
      const surfableHours = [
        {
          startTime: new Date('2025-01-15T10:00:00.000Z').getTime() / 1000,
          endTime: new Date('2025-01-15T12:00:00.000Z').getTime() / 1000,
          spotId: 'malibu-123',
          condition: 'Good',
          waveHeight: 4.5,
        },
      ];
      const busySlots: TimeSlot[] = [
        // No busy slots, so surfable hour should not be marked as conflict
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        startTime: new Date('2025-01-15T10:00:00.000Z').getTime() / 1000,
        endTime: new Date('2025-01-15T12:00:00.000Z').getTime() / 1000,
        spotId: 'malibu-123',
        condition: 'Good',
        waveHeight: 4.5,
        calendarConflict: false,
      });
    });

    it('should handle multiple spots correctly', () => {
      const surfableHours = [
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T11:00:00.000Z',
          'spot1',
        ),
        createSurfableHour(
          '2025-01-15T10:00:00.000Z',
          '2025-01-15T11:00:00.000Z',
          'spot2',
        ),
      ];
      const busySlots: TimeSlot[] = [
        // No busy slots, so both surfable hours should not be marked as conflicts
      ];

      const result = CalendarFilterService.markCalendarConflicts(
        surfableHours,
        busySlots,
      );

      expect(result).toHaveLength(2);
      expect(result[0].spotId).toBe('spot1');
      expect(result[0].calendarConflict).toBe(false);
      expect(result[1].spotId).toBe('spot2');
      expect(result[1].calendarConflict).toBe(false);
    });
  });
});

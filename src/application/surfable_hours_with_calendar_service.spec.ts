import { SurfableHoursWithCalendarService } from './surfable_hours_with_calendar_service';
import { SurflineFakeClient } from '../infrastructure/surfline_client/fake_client';
import { GoogleCalendarFakeClient } from '../infrastructure/google_calendar_client/fake_client';
import { TimeSlot } from '../infrastructure/google_calendar_client/types';
import { SurfableHour } from '../domain/types';

describe('SurfableHoursWithCalendarService', () => {
  let surflineClient: SurflineFakeClient;
  let googleCalendarClient: GoogleCalendarFakeClient;
  let service: SurfableHoursWithCalendarService;

  const spotId = '5842041f4e65fad6a7708876';
  const now = new Date('2025-01-15T08:00:00.000Z').getTime() / 1000;

  beforeEach(async () => {
    // Create surfline client with some test data
    surflineClient = new SurflineFakeClient();
    await surflineClient.login('test@example.com', 'password');

    // Create calendar client with busy slots
    const busySlots: TimeSlot[] = [
      {
        start: new Date('2025-01-15T10:00:00.000Z'),
        end: new Date('2025-01-15T11:00:00.000Z'),
      },
      {
        start: new Date('2025-01-15T14:00:00.000Z'),
        end: new Date('2025-01-15T15:00:00.000Z'),
      },
    ];
    googleCalendarClient = new GoogleCalendarFakeClient(
      busySlots,
      new Date('2025-01-15T08:00:00.000Z'),
    );

    service = new SurfableHoursWithCalendarService(
      surflineClient,
      googleCalendarClient,
    );
  });

  describe('getSurfableHoursWithCalendarFiltering', () => {
    it('should return all surfable hours when no calendar IDs are provided', async () => {
      const result = await service.getSurfableHoursWithCalendarFiltering({
        spotIds: [spotId],
        days: 1,
        now,
        calendarIds: undefined,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should return all surfable hours without calendar conflict flags
      result.forEach((hour) => {
        expect(hour.calendarConflict).toBeUndefined();
      });
    });

    it('should return all surfable hours when empty calendar IDs array is provided', async () => {
      const result = await service.getSurfableHoursWithCalendarFiltering({
        spotIds: [spotId],
        days: 1,
        now,
        calendarIds: [],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter surfable hours based on calendar availability', async () => {
      const result = await service.getSurfableHoursWithCalendarFiltering({
        spotIds: [spotId],
        days: 1,
        now,
        calendarIds: ['test@gmail.com'],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Verify that returned hours don't conflict with busy slots
      result.forEach((hour: SurfableHour) => {
        const surfStart = new Date(hour.startTime * 1000);
        const surfEnd = new Date(hour.endTime * 1000);

        // Should not overlap with busy slots
        const busySlot1Start = new Date('2025-01-15T10:00:00.000Z');
        const busySlot1End = new Date('2025-01-15T11:00:00.000Z');
        const busySlot2Start = new Date('2025-01-15T14:00:00.000Z');
        const busySlot2End = new Date('2025-01-15T15:00:00.000Z');

        const overlapsWithBusy1 =
          surfStart < busySlot1End && surfEnd > busySlot1Start;
        const overlapsWithBusy2 =
          surfStart < busySlot2End && surfEnd > busySlot2Start;

        expect(overlapsWithBusy1).toBe(false);
        expect(overlapsWithBusy2).toBe(false);
      });
    });

    it('should handle multiple calendar IDs', async () => {
      const result = await service.getSurfableHoursWithCalendarFiltering({
        spotIds: [spotId],
        days: 1,
        now,
        calendarIds: ['cal1@gmail.com', 'cal2@gmail.com'],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiple spot IDs with calendar filtering', async () => {
      const result = await service.getSurfableHoursWithCalendarFiltering({
        spotIds: [spotId, '5842041f4e65fad6a7708815'],
        days: 1,
        now,
        calendarIds: ['test@gmail.com'],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should work without google calendar client', async () => {
      const serviceWithoutCalendar = new SurfableHoursWithCalendarService(
        surflineClient,
      );

      const result =
        await serviceWithoutCalendar.getSurfableHoursWithCalendarFiltering({
          spotIds: [spotId],
          days: 1,
          now,
          calendarIds: ['test@gmail.com'],
        });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should return all surfable hours since no calendar client is available
    });
  });
});

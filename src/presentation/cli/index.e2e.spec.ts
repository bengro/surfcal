import { runCLI } from './runner';
import { SurflineFakeClient } from '../../infrastructure/surfline_client/fake_client';
import {
  Rating,
  Sunlight,
  SurfData,
  Wind,
} from '../../infrastructure/surfline_client/types';
import { GoogleCalendarFakeClient } from '../../infrastructure/google_calendar_client/fake_client';
import { TimeSlot } from '../../infrastructure/google_calendar_client/types';

describe('CLI End-to-End Tests', () => {
  let fakeGoogleCalendarClient: GoogleCalendarFakeClient;
  let fakeSurflineClient: SurflineFakeClient;

  const calendarId = 'test@gmail.com';
  const testSpotId = '5842041f4e65fad6a7708876'; // Malibu
  const testSpotId2 = '5842041f4e65fad6a7708815'; // Pipeline

  beforeEach(async () => {
    fakeSurflineClient = new SurflineFakeClient();
    await fakeSurflineClient.login('test@example.com', 'testpassword');

    // Create calendar client with some busy slots
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
    fakeGoogleCalendarClient = new GoogleCalendarFakeClient(
      busySlots,
      new Date('2025-01-15T08:00:00.000Z'),
    );
  });

  describe('Help and Usage', () => {
    it('should display help when no arguments are provided', async () => {
      const result = await runCLI([], fakeSurflineClient);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Welcome to surfcal!');
      expect(result.output).toContain('Usage:');
      expect(result.output).toContain('--spotId');
      expect(result.output).toContain('--today');
      expect(result.output).toContain('--tomorrow');
      expect(result.output).toContain('--week');
      expect(result.output).toContain('--on');
      expect(result.output).toContain('Popular spot IDs:');
      expect(result.output).toContain('Malibu:');
      expect(result.output).toContain('Pipeline:');
    });

    it('should show error when no spotId is provided', async () => {
      const result = await runCLI(['--today'], fakeSurflineClient);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Error: At least one --spotId argument is required.',
      );
    });

    it('should show error when spotId value is missing', async () => {
      const result = await runCLI(['--spotId'], fakeSurflineClient);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Error: --spotId requires a spotId value.',
      );
    });
  });

  describe('--today Command', () => {
    it('should display surfable hours for today with single spot', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for today (1 spot):');
      // Should contain either surfable hours or friendly "no surfable hours" message
      expect(
        result.output.includes('🏄') ||
          result.output.includes('🌊 No surfable hours found for today.'),
      ).toBe(true);
    });

    it('should display surfable hours for today with multiple spots', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--spotId', testSpotId2, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for today (2 spots):');
      expect(
        result.output.includes('📍 Spot:') ||
          result.output.includes('🌊 No surfable hours found for today.'),
      ).toBe(true);
    });

    it('should show spot names in output for today', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      if (result.output.includes('📍 Spot:')) {
        expect(result.output).toContain('Malibu');
      }
    });
  });

  describe('--tomorrow Command', () => {
    it('should display surfable hours for tomorrow with single spot', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--tomorrow'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for tomorrow (1 spot):');
      expect(
        result.output.includes('🏄') ||
          result.output.includes('🌊 No surfable hours found for tomorrow.'),
      ).toBe(true);
    });

    it('should display surfable hours for tomorrow with multiple spots', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--spotId', testSpotId2, '--tomorrow'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for tomorrow (2 spots):');
      expect(
        result.output.includes('📍 Spot:') ||
          result.output.includes('🌊 No surfable hours found for tomorrow.'),
      ).toBe(true);
    });
  });

  describe('--week Command', () => {
    it('should display surfable hours for the week with single spot', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--week'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for the week (1 spot):');
      expect(
        result.output.includes('📍 Spot:') ||
          result.output.includes(
            '🌊 No surfable hours found for the next 7 days.',
          ),
      ).toBe(true);
    });

    it('should display surfable hours for the week with multiple spots', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--spotId', testSpotId2, '--week'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for the week (2 spots):');
      expect(
        result.output.includes('📍 Spot:') ||
          result.output.includes(
            '🌊 No surfable hours found for the next 7 days.',
          ),
      ).toBe(true);
    });

    it('should group hours by day in week view', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--week'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      if (result.output.includes('📅')) {
        // Should show day groupings
        expect(result.output).toMatch(/📅.*day.*:/);
      }
    });
  });

  describe('--on Command', () => {
    const testDate = '15/09/2025'; // Future date in dd/mm/yyyy format

    it('should display surfable hours for specific date with single spot', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--on', testDate],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain(
        `Surfable hours for ${testDate} (1 spot):`,
      );
      expect(
        result.output.includes('🏄') ||
          result.output.includes(`🌊 No surfable hours found for ${testDate}.`),
      ).toBe(true);
    });

    it('should show error for invalid date format', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--on', 'invalid-date'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Error: Invalid date format. Use dd/mm/yyyy.',
      );
    });

    it('should show error when --on has no date argument', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--on'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Error: --on requires a date argument in dd/mm/yyyy format.',
      );
    });

    it('should validate date components', async () => {
      const invalidDates = ['32/01/2025', '01/13/2025', 'ab/cd/efgh'];

      for (const invalidDate of invalidDates) {
        const result = await runCLI(
          ['--spotId', testSpotId, '--on', invalidDate],
          fakeSurflineClient,
        );
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Error: Invalid date format. Use dd/mm/yyyy.',
        );
      }
    });
  });

  describe('Multiple Spot IDs', () => {
    it('should handle multiple spot IDs correctly', async () => {
      const result = await runCLI(
        [
          '--spotId',
          testSpotId,
          '--spotId',
          testSpotId2,
          '--spotId',
          '5842041f4e65fad6a770883d', // Bells Beach
          '--today',
        ],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for today (3 spots):');
    });

    it('should show correct pluralization for single vs multiple spots', async () => {
      const singleResult = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );
      const multiResult = await runCLI(
        ['--spotId', testSpotId, '--spotId', testSpotId2, '--today'],
        fakeSurflineClient,
      );

      expect(singleResult.output).toContain('(1 spot):');
      expect(multiResult.output).toContain('(2 spots):');
    });
  });

  describe('Output Formatting', () => {
    it('should use emojis for visual appeal', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      // Should contain wave or surf emojis
      expect(result.output).toMatch(/[🌊🏄📍]/);
    });

    it('should show spot names when available', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      if (result.output.includes('📍 Spot:')) {
        // Should show spot name with ID in parentheses
        expect(result.output).toContain('Malibu');
        expect(result.output).toContain(`(${testSpotId})`);
      }
    });
  });

  describe('Command Combinations', () => {
    it('should prioritize first valid command when multiple are provided', async () => {
      const result = await runCLI(
        ['--spotId', testSpotId, '--today', '--tomorrow'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for today');
      expect(result.output).not.toContain('Surfable hours for tomorrow');
    });

    it('should handle mixed argument order', async () => {
      const result = await runCLI(
        ['--today', '--spotId', testSpotId],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Surfable hours for today (1 spot):');
    });
  });

  describe('Surfable Hours with Custom Data', () => {
    it('should show surfable hours when conditions are good', async () => {
      const now = Date.now() / 1000;
      const goodTimestamp = now + 3600; // 1 hour from now

      fakeSurflineClient.setRatings([
        {
          timestamp: goodTimestamp,
          utcOffset: 0,
          rating: { key: 'GOOD', value: 4 },
        } as Rating,
      ]);
      fakeSurflineClient.setSunlight([
        {
          sunrise: now - 3600, // 1 hour ago
          sunriseUTCOffset: 0,
          sunset: now + 14400, // 4 hours from now (ensure it's well after the surfable hour)
          sunsetUTCOffset: 0,
          midnight: now - 43200, // 12 hours ago
          midnightUTCOffset: 0,
          dawn: now - 7200,
          dawnUTCOffset: 0,
          dusk: now + 18000,
          duskUTCOffset: 0,
        } as Sunlight,
      ]);
      fakeSurflineClient.setSurf([
        {
          timestamp: goodTimestamp,
          utcOffset: 0,
          surf: {
            min: 2,
            max: 4,
            plus: false,
            humanRelation: 'Waist to chest high',
            raw: { min: 2, max: 4 },
          },
        } as SurfData,
      ]);
      fakeSurflineClient.setWind([
        {
          timestamp: goodTimestamp,
          utcOffset: 0,
          speed: 12,
          direction: 180,
          directionType: 'ONSHORE',
          gust: 18,
          optimalScore: 2,
        } as Wind,
      ]);

      const result = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('📍 Spot: Malibu');
      expect(result.output).toContain('🏄');
      expect(result.output).toContain('GOOD');
      expect(result.output).toContain('4ft');
    });

    it('should show no surfable hours message when conditions are poor', async () => {
      const now = Date.now() / 1000;
      const poorTimestamp = now + 3600;

      fakeSurflineClient.setRatings([
        { timestamp: poorTimestamp, rating: { key: 'POOR' } } as Rating,
      ]);
      fakeSurflineClient.setSunlight([
        {
          sunrise: now - 3600,
          sunset: now + 7200,
          midnight: now - 86400,
        } as Sunlight,
      ]);
      fakeSurflineClient.setSurf([
        {
          timestamp: poorTimestamp,
          utcOffset: 0,
          surf: {
            min: 1,
            max: 1,
            plus: false,
            humanRelation: 'Ankle high',
            raw: { min: 1, max: 1 },
          },
        } as SurfData,
      ]);

      const result = await runCLI(
        ['--spotId', testSpotId, '--today'],
        fakeSurflineClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('🌊 No surfable hours found for today.');
    });
  });

  describe('Calendar parameter parsing', () => {
    it('should parse single --calendar argument', async () => {
      const args = [
        '--spotId',
        testSpotId,
        '--calendar',
        calendarId,
        '--today',
      ];
      const result = await runCLI(
        args,
        fakeSurflineClient,
        fakeGoogleCalendarClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('filtered by 1 calendar');
    });

    it('should parse multiple --calendar arguments', async () => {
      const args = [
        '--spotId',
        testSpotId,
        '--calendar',
        'cal1@gmail.com',
        '--calendar',
        'cal2@gmail.com',
        '--today',
      ];
      const result = await runCLI(
        args,
        fakeSurflineClient,
        fakeGoogleCalendarClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('filtered by 2 calendars');
    });

    it('should return error when --calendar has no value', async () => {
      const args = ['--spotId', testSpotId, '--calendar', '--today'];
      const result = await runCLI(
        args,
        fakeSurflineClient,
        fakeGoogleCalendarClient,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Error: --calendar requires a calendar ID value.',
      );
    });

    it('should work without --calendar arguments', async () => {
      const args = ['--spotId', testSpotId, '--today'];
      const result = await runCLI(
        args,
        fakeSurflineClient,
        fakeGoogleCalendarClient,
      );

      expect(result.success).toBe(true);
      expect(result.output).not.toContain('filtered by');
    });
  });
});

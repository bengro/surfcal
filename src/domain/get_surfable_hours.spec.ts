import { getSurfableHours } from './get_surfable_hours';
import { SurflineFakeClient } from '../infrastructure/surfline_client/fake_client';
import { SurfCriteria, DEFAULT_SURF_CRITERIA } from './types';
import {
  Rating,
  Sunlight,
  SurfData,
} from '../infrastructure/surfline_client/types';

describe('getSurfableHours', () => {
  it('should return a single surfable hour', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const goodTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: goodTimestamp, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunriseUTCOffset: 0,
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        sunsetUTCOffset: 0,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
        midnightUTCOffset: 0,
        dawn: 1619850000,
        dawnUTCOffset: 0,
        dusk: 1619898000,
        duskUTCOffset: 0,
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: goodTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      goodTimestamp,
    );
    expect(surfableHours).toEqual([
      {
        startTime: goodTimestamp,
        endTime: goodTimestamp + 3600,
        spotId,
        waveHeight: 3,
        condition: 'GOOD',
      },
    ]);
  });

  it('should return multiple surfable hours and handle consecutive hours', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const startTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC
    const secondTimestamp = startTimestamp + 3600; // 2021-05-01 11:00:00 UTC
    const thirdTimestamp = secondTimestamp + 3600; // 2021-05-01 12:00:00 UTC
    const fourthTimestamp = thirdTimestamp + 7200; // 2021-05-01 14:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: startTimestamp, rating: { key: 'GOOD' } },
      { timestamp: secondTimestamp, rating: { key: 'FAIR' } },
      { timestamp: thirdTimestamp, rating: { key: 'VERY_GOOD' } },
      { timestamp: fourthTimestamp, rating: { key: 'GOOD' } },
    ] as Rating[]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunriseUTCOffset: 0,
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        sunsetUTCOffset: 0,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
        midnightUTCOffset: 0,
        dawn: 1619850000,
        dawnUTCOffset: 0,
        dusk: 1619898000,
        duskUTCOffset: 0,
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: startTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
      {
        timestamp: secondTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 4,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 4 },
        },
      },
      {
        timestamp: thirdTimestamp,
        utcOffset: 0,
        surf: {
          min: 3,
          max: 5,
          plus: false,
          humanRelation: '',
          raw: { min: 3, max: 5 },
        },
      },
      {
        timestamp: fourthTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
    ] as SurfData[]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      startTimestamp - 3600,
    );

    expect(surfableHours).toHaveLength(4);
  });

  it('should dismiss surfable hours before sunrise', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const sunrise = 1619852400; // 2021-05-01 07:00:00 UTC
    const badTimestamp = sunrise - 3600; // 2021-05-01 06:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: badTimestamp, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: sunrise,
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: badTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      badTimestamp - 3600,
    );
    expect(surfableHours).toEqual([]);
  });

  it('should dismiss surfable hours after sunset', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const sunset = 1619895600; // 2021-05-01 19:00:00 UTC
    const badTimestamp = sunset + 3600; // 2021-05-01 20:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: badTimestamp, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunset: sunset,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: badTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      badTimestamp - 3600,
    );
    expect(surfableHours).toEqual([]);
  });

  it('should return surfable hours that end exactly at sunset', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const sunset = 1619895600; // 2021-05-01 19:00:00 UTC
    const goodTimestamp = sunset - 3600; // 2021-05-01 18:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: goodTimestamp, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunriseUTCOffset: 0,
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        sunsetUTCOffset: 0,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
        midnightUTCOffset: 0,
        dawn: 1619850000,
        dawnUTCOffset: 0,
        dusk: 1619898000,
        duskUTCOffset: 0,
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: goodTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      goodTimestamp - 3600,
    );
    expect(surfableHours).toHaveLength(1);
  });

  it('should dismiss surfable hours that end after sunset', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const sunset = 1619895600; // 2021-05-01 19:00:00 UTC
    const badTimestamp = sunset - 3599; // 2021-05-01 18:00:01 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: badTimestamp, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunset: sunset,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: badTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      badTimestamp - 3600,
    );
    expect(surfableHours).toEqual([]);
  });

  it('should dismiss surfable hours with waves too small', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const goodTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: goodTimestamp, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: goodTimestamp,
        utcOffset: 0,
        surf: {
          min: 1,
          max: 1, // Wave height is too small
          plus: false,
          humanRelation: '',
          raw: { min: 1, max: 1 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      goodTimestamp - 3600,
    );
    expect(surfableHours).toEqual([]);
  });

  it('should dismiss surfable hours with insufficient rating', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const goodTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: goodTimestamp, rating: { key: 'POOR' } } as Rating, // Insufficient rating
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: goodTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      7,
      goodTimestamp - 3600,
    );
    expect(surfableHours).toEqual([]);
  });

  it('should correctly handle timestamps that are on the next day in UTC', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    // This timestamp is on the next day in UTC, but not in the local timezone of the spot
    const timestampOnNextDayInUTC = 1619823600; // 2021-04-30 23:00:00 UTC, which is 2021-05-01 in some timezones

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: timestampOnNextDayInUTC, rating: { key: 'GOOD' } } as Rating,
    ]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        midnight: 1619823600,
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: timestampOnNextDayInUTC,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      } as SurfData,
    ]);

    const surfableHours = await getSurfableHours(
      [spotId],
      client,
      1,
      timestampOnNextDayInUTC - 3600,
    );
    expect(surfableHours).toHaveLength(0);
  });

  it('should not return surfable hours that have already passed', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const now = 1619866800; // 2021-05-01 11:00:00 UTC
    const pastTimestamp = now - 3600; // 2021-05-01 10:00:00 UTC
    const futureTimestamp = now + 3600; // 2021-05-01 12:00:00 UTC

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: pastTimestamp, rating: { key: 'GOOD' } },
      { timestamp: futureTimestamp, rating: { key: 'GOOD' } },
    ] as Rating[]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunriseUTCOffset: 0,
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        sunsetUTCOffset: 0,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
        midnightUTCOffset: 0,
        dawn: 1619850000,
        dawnUTCOffset: 0,
        dusk: 1619898000,
        duskUTCOffset: 0,
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: pastTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
      {
        timestamp: futureTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
    ] as SurfData[]);

    const surfableHours = await getSurfableHours([spotId], client, 7, now);
    expect(surfableHours).toEqual([
      {
        startTime: futureTimestamp,
        endTime: futureTimestamp + 3600,
        spotId,
        waveHeight: 3,
        condition: 'GOOD',
      },
    ]);
  });

  it('should only return surfable hours for the current day when forDays is 1', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const now = 1619866800; // 2021-05-01 11:00:00 UTC
    const todayTimestamp = now + 3600; // 2021-05-01 12:00:00 UTC (same day)
    const tomorrowTimestamp = now + 86400; // 2021-05-02 11:00:00 UTC (next day)

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: todayTimestamp, rating: { key: 'GOOD' } },
      { timestamp: tomorrowTimestamp, rating: { key: 'GOOD' } },
    ] as Rating[]);
    client.setSunlight([
      {
        sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
        sunriseUTCOffset: 0,
        sunset: 1619895600, // 2021-05-01 19:00:00 UTC
        sunsetUTCOffset: 0,
        midnight: 1619823600, // 2021-04-30 23:00:00 UTC
      } as Sunlight,
      {
        sunrise: 1619938800, // 2021-05-02 07:00:00 UTC
        sunriseUTCOffset: 0,
        sunset: 1619982000, // 2021-05-02 19:00:00 UTC
        sunsetUTCOffset: 0,
        midnight: 1619910000, // 2021-05-01 23:00:00 UTC
      } as Sunlight,
    ]);

    client.setSurf([
      {
        timestamp: todayTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
      {
        timestamp: tomorrowTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
    ] as SurfData[]);

    // When forDays is 1, should only return today's surfable hours
    const surfableHours = await getSurfableHours([spotId], client, 1, now);
    expect(surfableHours).toEqual([
      {
        startTime: todayTimestamp,
        endTime: todayTimestamp + 3600,
        spotId,
        waveHeight: 3,
        condition: 'GOOD',
      },
    ]);
  });

  it('should not return surfable hours after sunset (reproducing real-world issue)', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const now = 1757796000; // 2025-09-13 21:00:00 UTC (current time)
    const afterSunsetTimestamp = 1757800800; // 2025-09-13 22:00:00 UTC (23:00 local time)
    const sunset = 1757793600; // 2025-09-13 20:00:00 UTC (sunset was at 21:00 local time)

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: afterSunsetTimestamp, rating: { key: 'GOOD' } },
    ] as Rating[]);
    client.setSunlight([
      {
        sunrise: 1757754000, // 2025-09-13 08:00:00 UTC
        sunset: sunset, // 2025-09-13 20:00:00 UTC (sunset)
        midnight: 1757746800, // 2025-09-13 06:00:00 UTC (midnight for this day)
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: afterSunsetTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
    ] as SurfData[]);

    // This should return empty array because the timestamp is after sunset
    const surfableHours = await getSurfableHours([spotId], client, 1, now);
    expect(surfableHours).toEqual([]);
  });

  it('should handle edge case where timestamp is near midnight boundary', async () => {
    const spotId = '5842041f4e65fad6a77088ea';
    const now = 1757796000; // 2025-09-13 21:00:00 UTC
    const lateNightTimestamp = 1757800800; // 2025-09-13 22:00:00 UTC (23:00 local time)

    const client = new SurflineFakeClient();
    await client.login('email', 'password');

    client.setRatings([
      { timestamp: lateNightTimestamp, rating: { key: 'GOOD' } },
    ] as Rating[]);
    // Include sunlight data for both current day and next day
    client.setSunlight([
      {
        sunrise: 1757754000, // 2025-09-13 08:00:00 UTC
        sunset: 1757793600, // 2025-09-13 20:00:00 UTC (sunset)
        midnight: 1757746800, // 2025-09-13 06:00:00 UTC (midnight for current day)
      } as Sunlight,
      {
        sunrise: 1757840400, // 2025-09-14 08:00:00 UTC
        sunset: 1757880000, // 2025-09-14 20:00:00 UTC (sunset)
        midnight: 1757833200, // 2025-09-14 06:00:00 UTC (midnight for next day)
      } as Sunlight,
    ]);
    client.setSurf([
      {
        timestamp: lateNightTimestamp,
        utcOffset: 0,
        surf: {
          min: 2,
          max: 3,
          plus: false,
          humanRelation: '',
          raw: { min: 2, max: 3 },
        },
      },
    ] as SurfData[]);

    // This should return empty array because the timestamp is after sunset of current day
    const surfableHours = await getSurfableHours([spotId], client, 1, now);
    expect(surfableHours).toEqual([]);
  });

  describe('configurable criteria', () => {
    it('should respect custom minimum wave height', async () => {
      const spotId = '5842041f4e65fad6a77088ea';
      const goodTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC

      const client = new SurflineFakeClient();
      await client.login('email', 'password');

      client.setRatings([
        { timestamp: goodTimestamp, rating: { key: 'GOOD' } } as Rating,
      ]);
      client.setSunlight([
        {
          sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
          sunriseUTCOffset: 0,
          sunset: 1619895600, // 2021-05-01 19:00:00 UTC
          sunsetUTCOffset: 0,
          midnight: 1619823600, // 2021-04-30 23:00:00 UTC
          midnightUTCOffset: 0,
          dawn: 1619850000,
          dawnUTCOffset: 0,
          dusk: 1619898000,
          duskUTCOffset: 0,
        } as Sunlight,
      ]);
      client.setSurf([
        {
          timestamp: goodTimestamp,
          utcOffset: 0,
          surf: {
            min: 2,
            max: 2.5, // Wave height is 2.5 feet
            plus: false,
            humanRelation: '',
            raw: { min: 2, max: 2.5 },
          },
        } as SurfData,
      ]);

      // With default criteria (2ft min), should return the hour
      const defaultCriteria: SurfCriteria = DEFAULT_SURF_CRITERIA;
      const surfableHoursDefault = await getSurfableHours(
        [spotId],
        client,
        7,
        goodTimestamp,
        defaultCriteria,
      );
      expect(surfableHoursDefault).toHaveLength(1);

      // With higher criteria (3ft min), should not return the hour
      const strictCriteria: SurfCriteria = {
        minWaveHeight: 3,
        minRating: 'POOR_TO_FAIR',
      };
      const surfableHoursStrict = await getSurfableHours(
        [spotId],
        client,
        7,
        goodTimestamp,
        strictCriteria,
      );
      expect(surfableHoursStrict).toHaveLength(0);
    });

    it('should respect custom minimum rating', async () => {
      const spotId = '5842041f4e65fad6a77088ea';
      const goodTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC

      const client = new SurflineFakeClient();
      await client.login('email', 'password');

      client.setRatings([
        { timestamp: goodTimestamp, rating: { key: 'FAIR' } } as Rating, // Rating is FAIR
      ]);
      client.setSunlight([
        {
          sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
          sunriseUTCOffset: 0,
          sunset: 1619895600, // 2021-05-01 19:00:00 UTC
          sunsetUTCOffset: 0,
          midnight: 1619823600, // 2021-04-30 23:00:00 UTC
          midnightUTCOffset: 0,
          dawn: 1619850000,
          dawnUTCOffset: 0,
          dusk: 1619898000,
          duskUTCOffset: 0,
        } as Sunlight,
      ]);
      client.setSurf([
        {
          timestamp: goodTimestamp,
          utcOffset: 0,
          surf: {
            min: 2,
            max: 3,
            plus: false,
            humanRelation: '',
            raw: { min: 2, max: 3 },
          },
        } as SurfData,
      ]);

      // With default criteria (POOR_TO_FAIR min), should return the hour
      const defaultCriteria: SurfCriteria = DEFAULT_SURF_CRITERIA;
      const surfableHoursDefault = await getSurfableHours(
        [spotId],
        client,
        7,
        goodTimestamp,
        defaultCriteria,
      );
      expect(surfableHoursDefault).toHaveLength(1);

      // With higher criteria (GOOD min), should not return the hour
      const strictCriteria: SurfCriteria = {
        minWaveHeight: 2,
        minRating: 'GOOD',
      };
      const surfableHoursStrict = await getSurfableHours(
        [spotId],
        client,
        7,
        goodTimestamp,
        strictCriteria,
      );
      expect(surfableHoursStrict).toHaveLength(0);
    });

    it('should use default criteria when none provided', async () => {
      const spotId = '5842041f4e65fad6a77088ea';
      const goodTimestamp = 1619863200; // 2021-05-01 10:00:00 UTC

      const client = new SurflineFakeClient();
      await client.login('email', 'password');

      client.setRatings([
        { timestamp: goodTimestamp, rating: { key: 'POOR_TO_FAIR' } } as Rating,
      ]);
      client.setSunlight([
        {
          sunrise: 1619852400, // 2021-05-01 07:00:00 UTC
          sunriseUTCOffset: 0,
          sunset: 1619895600, // 2021-05-01 19:00:00 UTC
          sunsetUTCOffset: 0,
          midnight: 1619823600, // 2021-04-30 23:00:00 UTC
          midnightUTCOffset: 0,
          dawn: 1619850000,
          dawnUTCOffset: 0,
          dusk: 1619898000,
          duskUTCOffset: 0,
        } as Sunlight,
      ]);
      client.setSurf([
        {
          timestamp: goodTimestamp,
          utcOffset: 0,
          surf: {
            min: 2,
            max: 2, // Exactly 2 feet (default minimum)
            plus: false,
            humanRelation: '',
            raw: { min: 2, max: 2 },
          },
        } as SurfData,
      ]);

      // Without criteria parameter, should use defaults (2ft, POOR_TO_FAIR)
      const surfableHours = await getSurfableHours(
        [spotId],
        client,
        7,
        goodTimestamp,
      );
      expect(surfableHours).toHaveLength(1);
      expect(surfableHours[0]).toEqual({
        startTime: goodTimestamp,
        endTime: goodTimestamp + 3600,
        spotId,
        waveHeight: 2,
        condition: 'POOR_TO_FAIR',
      });
    });
  });
});

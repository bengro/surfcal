import { getGoodSurfWindows, isGoodRating, isGoodWaveHeight, isSunlight } from './good_surf_windows';
import { SurflineFakeClient } from './surfline_client/fake_client';
import { Rating, Sunlight, Wave } from './surfline_client/types';

describe('isGoodRating', () => {
    it('should return true for ratings that are POOR_TO_FAIR or better', () => {
        expect(isGoodRating({ timestamp: 0, rating: { key: 'POOR_TO_FAIR' } } as Rating)).toBe(true);
        expect(isGoodRating({ timestamp: 0, rating: { key: 'FAIR' } } as Rating)).toBe(true);
        expect(isGoodRating({ timestamp: 0, rating: { key: 'GOOD' } } as Rating)).toBe(true);
        expect(isGoodRating({ timestamp: 0, rating: { key: 'VERY_GOOD' } } as Rating)).toBe(true);
    });

    it('should return false for ratings that are worse than POOR_TO_FAIR', () => {
        expect(isGoodRating({ timestamp: 0, rating: { key: 'VERY_POOR' } } as Rating)).toBe(false);
        expect(isGoodRating({ timestamp: 0, rating: { key: 'POOR' } } as Rating)).toBe(false);
    });
});

describe('isSunlight', () => {
    const sunlightForDay: Sunlight = {
        sunrise: 1619852400, // 2021-05-01 06:00:00
        sunset: 1619895600,  // 2021-05-01 18:00:00
        midnight: 1619823600,
        midnightUTCOffset: 0,
        dawn: 1619850600,
        dawnUTCOffset: 0,
        sunriseUTCOffset: 0,
        sunsetUTCOffset: 0,
        dusk: 1619897400,
        duskUTCOffset: 0,
    };

    it('should return true for times between sunrise and one hour before sunset', () => {
        const timestamp = 1619863200; // 2021-05-01 09:00:00
        expect(isSunlight(timestamp, sunlightForDay)).toBe(true);
    });

    it('should return false for times before sunrise', () => {
        const timestamp = 1619848800; // 2021-05-01 05:00:00
        expect(isSunlight(timestamp, sunlightForDay)).toBe(false);
    });

    it('should return false for times after one hour before sunset', () => {
        const timestamp = 1619893800; // 2021-05-01 17:30:00
        expect(isSunlight(timestamp, sunlightForDay)).toBe(false);
    });
});

describe('isGoodWaveHeight', () => {
    it('should return true for waves with a max height of 2 or greater', () => {
        expect(isGoodWaveHeight({ surf: { max: 2 } } as Wave)).toBe(true);
        expect(isGoodWaveHeight({ surf: { max: 3 } } as Wave)).toBe(true);
    });

    it('should return false for waves with a max height less than 2', () => {
        expect(isGoodWaveHeight({ surf: { max: 1.9 } } as Wave)).toBe(false);
    });
});

describe('getGoodSurfWindows', () => {
    it('should return a single surfable time window', async () => {
        const spotId = '5842041f4e65fad6a77088ea';
        const goodTimestamp = 1619863200;

        const client = new SurflineFakeClient();
        await client.login('email', 'password');

        client.setRatings([
            { timestamp: goodTimestamp, rating: { key: 'GOOD' } } as Rating,
        ]);
        client.setSunlight([
            {
                sunrise: 1619852400,
                sunset: 1619895600,
                midnight: 1619823600,
            } as Sunlight,
        ]);
        client.setWave([
            { timestamp: goodTimestamp, surf: { max: 3 } } as Wave,
        ]);

        const goodWindows = await getGoodSurfWindows([spotId], client);
        expect(goodWindows).toEqual([
            {
                startTime: goodTimestamp,
                endTime: goodTimestamp,
                spotId,
                waveHeight: 3,
            }
        ]);
    });

    it('should return multiple surfable time windows and handle consecutive hours', async () => {
        const spotId = '5842041f4e65fad6a77088ea';
        const startTimestamp = 1619863200; // 9:00
        const secondTimestamp = startTimestamp + 3600; // 10:00
        const thirdTimestamp = secondTimestamp + 3600; // 11:00
        const fourthTimestamp = thirdTimestamp + 7200; // 13:00, skipping one hour

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
                sunrise: 1619852400,
                sunset: 1619895600,
                midnight: 1619823600,
            } as Sunlight,
        ]);
        client.setWave([
            { timestamp: startTimestamp, surf: { max: 2.5 } },
            { timestamp: secondTimestamp, surf: { max: 3 } },
            { timestamp: thirdTimestamp, surf: { max: 2.8 } },
            { timestamp: fourthTimestamp, surf: { max: 4 } },
        ] as Wave[]);

        const goodWindows = await getGoodSurfWindows([spotId], client);
        expect(goodWindows).toEqual([
            {
                startTime: startTimestamp,
                endTime: thirdTimestamp,
                spotId,
                waveHeight: 3, // Max of 2.5, 3, 2.8
            },
            {
                startTime: fourthTimestamp,
                endTime: fourthTimestamp,
                spotId,
                waveHeight: 4,
            }
        ]);
    });
});

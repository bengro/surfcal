import { getSurfableHours } from './get_surfable_hours';
import { SurflineFakeClient } from '../infrastructure/surfline_client/fake_client';
import { Rating, Sunlight, SurfData } from '../infrastructure/surfline_client/types';

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

        const surfableHours = await getSurfableHours([spotId], client);
        expect(surfableHours).toEqual([
            {
                startTime: goodTimestamp,
                endTime: goodTimestamp + 3600,
                spotId,
                waveHeight: 3,
            }
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
                sunset: 1619895600, // 2021-05-01 19:00:00 UTC
                midnight: 1619823600, // 2021-04-30 23:00:00 UTC
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

        const surfableHours = await getSurfableHours([spotId], client);

        expect(surfableHours).toHaveLength(4)
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

        const surfableHours = await getSurfableHours([spotId], client);
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

        const surfableHours = await getSurfableHours([spotId], client);
        expect(surfableHours).toEqual([]);
    });

    it('should dismiss surfable hours that end too close to sunset', async () => {
        const spotId = '5842041f4e65fad6a77088ea';
        const sunset = 1619895600; // 2021-05-01 19:00:00 UTC
        const badTimestamp = sunset - 3600; // 2021-05-01 18:00:00 UTC

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

        const surfableHours = await getSurfableHours([spotId], client);
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

        const surfableHours = await getSurfableHours([spotId], client);
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

        const surfableHours = await getSurfableHours([spotId], client);
        expect(surfableHours).toEqual([]);
    });
});

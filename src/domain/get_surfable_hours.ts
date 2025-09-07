import { env } from 'yargs';
import { SurflineHttpClient } from '../infrastructure/surfline_client/http_client';
import { Rating, Sunlight, RatingInfo, Wave, SurfData, SunlightResponse } from '../infrastructure/surfline_client/types';
import { SurflineClient } from '../infrastructure/surfline_client/surfline-client';
import { SurfableHour } from './types';

const RATING_ORDER: RatingInfo['key'][] = [
    "VERY_POOR",
    "POOR",
    "POOR_TO_FAIR",
    "FAIR",
    "GOOD",
    "VERY_GOOD"
];

export const getSurfableHours = async (spotIds: string[], client?: SurflineClient, forDays: number = 7): Promise<SurfableHour[]> => {
    const surfableHours: SurfableHour[] = [];

    if (!client) {
        client = new SurflineHttpClient();
        await client.login(process.env.SURFLINE_EMAIL as string, process.env.SURFLINE_PASSWORD as string);
    }

    for (const spotId of spotIds) {
        const [ratingsResponse, sunlightResponse, surfResponse] = await getAllSurfData(client, spotId, forDays);
        const sunlightMap = computeSunlightLookup(sunlightResponse);

        for (const hourlyRating of ratingsResponse.data.rating) {
            const timestamp = hourlyRating.timestamp;
            const day = mapToDayKey(timestamp);
            const sunlightForDay = sunlightMap.get(day);

            if (!sunlightForDay) {
                throw new Error('No sunlight data for the day of timestamp ' + timestamp);
            }

            const surfData = surfResponse.data.surf.find((w: SurfData) => w.timestamp === timestamp);
            const wave = surfData?.surf;

            if (wave && isGoodWaveHeight(wave) && isGoodRating(hourlyRating) && isSunlight(timestamp, sunlightForDay)) {
                surfableHours.push({
                    startTime: hourlyRating.timestamp,
                    endTime: hourlyRating.timestamp + 3600,
                    spotId,
                    waveHeight: wave.max,
                });
            }
        };
    }

    return surfableHours;
}

const isGoodRating = (rating: Rating): boolean => {
    const ratingIndex = RATING_ORDER.indexOf(rating.rating.key);
    const minRatingIndex = RATING_ORDER.indexOf("POOR_TO_FAIR");
    return ratingIndex >= minRatingIndex;
}

const isSunlight = (timestamp: number, sunlightForDay: Sunlight): boolean => {
    const pointInTime = new Date(timestamp * 1000);
    const sunrise = new Date(sunlightForDay.sunrise * 1000);
    const sunset = new Date(sunlightForDay.sunset * 1000);
    const twoHoursBeforeSunset = new Date(sunset.getTime() - (2 * 60 * 60 * 1000));

    return pointInTime >= sunrise && pointInTime <= twoHoursBeforeSunset;
}

const isGoodWaveHeight = (wave: Wave): boolean => {
    return wave.max >= 2;
}

const mapToDayKey = (timeInDay: number) => {
    const date = new Date(timeInDay * 1000);
    const dayString = date.toLocaleDateString('en-US');
    return dayString;
}

const computeSunlightLookup = (sunlightResponse: SunlightResponse) => {
    const sunlightMap = new Map<string, Sunlight>();
    for (const day of sunlightResponse.data.sunlight) {
        const dayString = mapToDayKey(day.sunrise);
        sunlightMap.set(dayString, day);
    }
    return sunlightMap;
}

const getAllSurfData = async (client: SurflineClient, spotId: string, days: number = 7): Promise<[any, any, any]> => {
    return await Promise.all([
        client.getRatings(spotId, days, 1),
        client.getSunlight(spotId, days),
        client.getSurf(spotId, days, 1),
    ]);
}


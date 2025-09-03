import { env } from 'yargs';
import { SurflineHttpClient } from './surfline_client/http_client';
import { Rating, Sunlight, Wave, RatingInfo } from './surfline_client/types';
import { SurflineClient } from './surfline_client/surfline-client';
import { SurfableTimeWindow } from './types';

const RATING_ORDER: RatingInfo['key'][] = [
    "VERY_POOR",
    "POOR",
    "POOR_TO_FAIR",
    "FAIR",
    "GOOD",
    "VERY_GOOD"
];

export const isGoodRating = (rating: Rating): boolean => {
    const ratingIndex = RATING_ORDER.indexOf(rating.rating.key);
    const minRatingIndex = RATING_ORDER.indexOf("POOR_TO_FAIR");
    return ratingIndex >= minRatingIndex;
}

export const isSunlight = (timestamp: number, sunlightForDay: Sunlight): boolean => {
    const date = new Date(timestamp * 1000);
    const sunrise = new Date(sunlightForDay.sunrise * 1000);
    const sunset = new Date(sunlightForDay.sunset * 1000);
    const oneHourBeforeSunset = new Date(sunset.getTime() - (60 * 60 * 1000));

    return date >= sunrise && date <= oneHourBeforeSunset;
}

export const isGoodWaveHeight = (wave: Wave): boolean => {
    return wave.surf.max >= 2;
}

export const getGoodSurfWindows = async (spotIds: string[], client?: SurflineClient): Promise<SurfableTimeWindow[]> => {
    const goodWindows: SurfableTimeWindow[] = [];

    if (!client) {
        client = new SurflineHttpClient();
        await client.login(process.env.SURFLINE_EMAIL as string, process.env.SURFLINE_PASSWORD as string);
    }

    for (const spotId of spotIds) {
        const [ratingsResponse, sunlightResponse, waveResponse] = await Promise.all([
            client.getRatings(spotId, 7, 1),
            client.getSunlight(spotId, 7),
            client.getWave(spotId, 7, 1),
        ]);

        const sunlightMap = new Map<string, Sunlight>();
        for (const day of sunlightResponse.data.sunlight) {
            const date = new Date(day.sunrise * 1000);
            const dayString = date.toLocaleDateString('en-US');
            sunlightMap.set(dayString, day);
        }

        const goodTimestamps: { timestamp: number, wave: Wave }[] = [];
        for (const rating of ratingsResponse.data.rating) {
            const timestamp = rating.timestamp;
            const date = new Date(timestamp * 1000);
            const dayString = date.toLocaleDateString('en-US');
            const sunlightForDay = sunlightMap.get(dayString);

            if (!sunlightForDay) {
                continue;
            }

            const wave = waveResponse.data.wave.find((w: Wave) => w.timestamp === timestamp);

            if (wave && isGoodRating(rating) && isSunlight(timestamp, sunlightForDay) && isGoodWaveHeight(wave)) {
                goodTimestamps.push({ timestamp, wave });
            }
        }

        if (goodTimestamps.length === 0) {
            continue;
        }

        let currentWindow: SurfableTimeWindow = {
            startTime: goodTimestamps[0].timestamp,
            endTime: goodTimestamps[0].timestamp,
            spotId,
            waveHeight: goodTimestamps[0].wave.surf.max,
        };

        for (let i = 1; i < goodTimestamps.length; i++) {
            const prevTimestamp = goodTimestamps[i - 1].timestamp;
            const currentTimestamp = goodTimestamps[i].timestamp;

            // Timestamps are hourly, so 3600 seconds apart
            if (currentTimestamp - prevTimestamp === 3600) {
                currentWindow.endTime = currentTimestamp;
                // Update wave height to be the max in the window
                currentWindow.waveHeight = Math.max(currentWindow.waveHeight, goodTimestamps[i].wave.surf.max);
            } else {
                goodWindows.push(currentWindow);
                currentWindow = {
                    startTime: currentTimestamp,
                    endTime: currentTimestamp,
                    spotId,
                    waveHeight: goodTimestamps[i].wave.surf.max,
                };
            }
        }
        goodWindows.push(currentWindow);
    }

    return goodWindows;
}

import 'dotenv/config';
import { SurflineHttpClient } from './http_client';
import { SurflineFakeClient } from './fake_client';
import { SurflineClient } from './surfline-client';

const email = process.env.SURFLINE_EMAIL as string;
const password = process.env.SURFLINE_PASSWORD as string;
const spotId = '584204214e65fad6a7709cef';

const clients: { name: string; client: SurflineClient }[] = [
    { name: 'SurflineHttpClient', client: new SurflineHttpClient() },
    { name: 'SurflineFakeClient', client: new SurflineFakeClient() },
];

describe.each(clients)('$name Contract Tests', ({ name, client }) => {

    beforeAll(async () => {
        await client.login(email, password);
    }, 30000);

    it('should be logged in successfully', () => {
        expect(client).toBeDefined();
    });

    it('should fetch ratings for a spot after logging in', async () => {
        const ratings = await client.getRatings(spotId, 1, 1);

        expect(ratings).toBeDefined();
        expect(ratings.associated).toBeDefined();
        expect(ratings.data.rating).toBeDefined();
        expect(ratings.data.rating.length).toBeGreaterThan(0);
    }, 30000);

    it('should fetch tides for a spot after logging in', async () => {
        const tides = await client.getTides(spotId, 1);

        expect(tides).toBeDefined();
        expect(tides.associated).toBeDefined();
        expect(tides.data.tides).toBeDefined();
        expect(tides.data.tides.length).toBeGreaterThan(0);
    }, 30000);

    it('should fetch weather for a spot after logging in', async () => {
        const weather = await client.getWeather(spotId, 1, 1);

        expect(weather).toBeDefined();
        expect(weather.associated).toBeDefined();
        expect(weather.data.weather).toBeDefined();
        expect(weather.data.weather.length).toBeGreaterThan(0);
    }, 30000);

    it('should fetch wave for a spot after logging in', async () => {
        const wave = await client.getWave(spotId, 1, 1);

        expect(wave).toBeDefined();
        expect(wave.associated).toBeDefined();
        expect(wave.data.wave).toBeDefined();
        expect(wave.data.wave.length).toBeGreaterThan(0);
    }, 30000);

    it('should fetch wind for a spot after logging in', async () => {
        const wind = await client.getWind(spotId, 1, 1);

        expect(wind).toBeDefined();
        expect(wind.associated).toBeDefined();
        expect(wind.data.wind).toBeDefined();
        expect(wind.data.wind.length).toBeGreaterThan(0);
    }, 30000);
});

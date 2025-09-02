import 'dotenv/config';
import { SurflineClient } from './index';

describe('SurflineClient Contract Tests', () => {
    let client: SurflineClient;
    const email = process.env.SURFLINE_EMAIL;
    const password = process.env.SURFLINE_PASSWORD;
    const spotId = '584204214e65fad6a7709cef';

    // Skip tests if credentials are not provided in environment variables
    if (!email || !password) {
        test.skip('Skipping contract tests because SURFLINE_EMAIL and SURFLINE_PASSWORD are not set', () => {});
        return;
    }

    beforeAll(async () => {
        client = new SurflineClient();
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
    }, 30000); // Increase timeout for network request

    it('should fetch tides for a spot after logging in', async () => {
        const tides = await client.getTides(spotId, 1);

        expect(tides).toBeDefined();
        expect(tides.associated).toBeDefined();
        expect(tides.data.tides).toBeDefined();
        expect(tides.data.tides.length).toBeGreaterThan(0);
    }, 30000);

    it('should fetch weather for a spot after logging in', async () => {
        const weather = await client.getWeather(spotId, 16, 1);

        expect(weather).toBeDefined();
        expect(weather.associated).toBeDefined();
        expect(weather.data.weather).toBeDefined();
        expect(weather.data.weather.length).toBeGreaterThan(0);
    }, 30000);
});

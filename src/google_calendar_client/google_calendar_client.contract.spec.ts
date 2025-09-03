import 'dotenv/config';
import { GoogleCalendarClient } from './google_calendar_client';
import { GoogleCalendarHttpClient } from './http_client';
import { GoogleCalendarFakeClient } from './fake_client';
import { TimeSlot } from './types';

const calendarId = 'benjamin.groehbiel@gmail.com';

function runContractTests(
  clientFactory: () => GoogleCalendarClient,
  clientName: string
) {
  describe(`${clientName} Contract Tests`, () => {
    let client: GoogleCalendarClient;

    beforeEach(() => {
      client = clientFactory();
    });

    it('should be defined', () => {
      expect(client).toBeDefined();
    });

    it('should fetch free slots for a calendar', async () => {
      const freeSlots = await client.getFreeSlots([calendarId]);
      expect(freeSlots).toBeDefined();
      expect(Array.isArray(freeSlots)).toBe(true);
    });
  });
}

runContractTests(
  () =>
    new GoogleCalendarHttpClient(process.env.GOOGLE_CALENDAR_API_KEY || ''),
  'GoogleCalendarHttpClient'
);

runContractTests(() => {
  const now = new Date('2025-01-01T00:00:00.000Z');
  const busySlots: TimeSlot[] = [
    {
      start: new Date('2025-01-02T10:00:00.000Z'),
      end: new Date('2025-01-02T12:00:00.000Z'),
    },
  ];
  return new GoogleCalendarFakeClient(busySlots);
}, 'GoogleCalendarFakeClient');

import 'dotenv/config';
import { GoogleCalendarClient } from './google_calendar_client';
import { GoogleCalendarHttpClient } from './http_client';
import { GoogleCalendarFakeClient } from './fake_client';
import { TimeSlot } from './types';

const calendarId = 'benjamin.groehbiel@gmail.com';

const now = new Date('2025-01-01T10:00:00.000Z');
const busySlots: TimeSlot[] = [
  // This busy slot starts 1 hour after `now`, creating a 1-hour free slot to be filtered out.
  {
    start: new Date('2025-01-01T11:00:00.000Z'),
    end: new Date('2025-01-01T12:00:00.000Z'),
  },
  // This busy slot starts 3 hours after the previous one ends, creating a 3-hour free slot.
  {
    start: new Date('2025-01-01T15:00:00.000Z'),
    end: new Date('2025-01-01T16:00:00.000Z'),
  },
];

const clients: { name: string; client: GoogleCalendarClient }[] = [
  {
    name: 'GoogleCalendarHttpClient',
    client: new GoogleCalendarHttpClient(
      process.env.GOOGLE_CALENDAR_API_KEY || ''
    ),
  },
  {
    name: 'GoogleCalendarFakeClient',
    client: new GoogleCalendarFakeClient(busySlots, now),
  },
];

describe.each(clients)('$name Contract Tests', ({ client }) => {
  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should fetch free slots for a calendar, slots of minimum 2h', async () => {
    const freeSlots = await client.getFreeSlots([calendarId]);
    expect(freeSlots).toBeDefined();
    freeSlots.forEach((slot) => {
      const durationInMs = slot.end.getTime() - slot.start.getTime();
      const durationInHours = durationInMs / (1000 * 60 * 60);
      expect(durationInHours).toBeGreaterThanOrEqual(2);
    });
  });
});

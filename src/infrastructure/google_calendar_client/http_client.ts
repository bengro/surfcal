import { GoogleCalendarClient } from './google_calendar_client';
import { TimeSlot } from './types';

interface CalendarEvent {
  start?: {
    dateTime?: string;
  };
  end?: {
    dateTime?: string;
  };
}

interface CalendarAPIResponse {
  items?: CalendarEvent[];
}

export class GoogleCalendarHttpClient implements GoogleCalendarClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  public async getBusySlots(calendarIds: string[]): Promise<TimeSlot[]> {
    const busySlots: TimeSlot[] = [];

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const calendarId of calendarIds) {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${this.apiKey}&timeMin=${now.toISOString()}&timeMax=${sevenDaysFromNow.toISOString()}&singleEvents=true&orderBy=startTime`;
      const response = await fetch(url);
      const data: CalendarAPIResponse = await response.json();

      const events = data.items;
      if (events) {
        for (const event of events) {
          if (event.start?.dateTime && event.end?.dateTime) {
            busySlots.push({
              start: new Date(event.start.dateTime),
              end: new Date(event.end.dateTime),
            });
          }
        }
      }
    }

    return busySlots;
  }
}

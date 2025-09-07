import { GoogleCalendarClient } from './google_calendar_client';
import { findFreeSlots } from './free_slot_finder';
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

  public async getFreeSlots(calendarIds: string[]): Promise<TimeSlot[]> {
    const busySlots: TimeSlot[] = [];
    for (const calendarId of calendarIds) {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${this.apiKey}`;
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

    return findFreeSlots(busySlots, new Date(), 7);
  }
}

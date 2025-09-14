import { GoogleCalendarClient } from './google_calendar_client';
import { TimeSlot } from './types';

export class GoogleCalendarFakeClient implements GoogleCalendarClient {
  private busySlots: TimeSlot[] = [];
  private now: Date;

  constructor(busySlots: TimeSlot[] = [], now?: Date) {
    this.busySlots = busySlots;
    this.now = now || new Date();
  }

  public async getBusySlots(calendarIds: string[]): Promise<TimeSlot[]> {
    // Return the busy slots that were configured in the constructor
    return this.busySlots;
  }
}

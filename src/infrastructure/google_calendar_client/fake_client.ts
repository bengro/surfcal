import { GoogleCalendarClient } from './google_calendar_client';
import { findFreeSlots } from './free_slot_finder';
import { TimeSlot } from './types';

export class GoogleCalendarFakeClient implements GoogleCalendarClient {
  private busySlots: TimeSlot[] = [];
  private now: Date;

  constructor(busySlots: TimeSlot[] = [], now?: Date) {
    this.busySlots = busySlots;
    this.now = now || new Date();
  }

  public async getFreeSlots(calendarIds: string[]): Promise<TimeSlot[]> {
    return findFreeSlots(this.busySlots, this.now, 7);
  }
}

import { GoogleCalendarClient } from './google_calendar_client';
import { findFreeSlots } from './free_slot_finder';
import { TimeSlot } from './types';

export class GoogleCalendarFakeClient implements GoogleCalendarClient {
  private busySlots: TimeSlot[] = [];

  constructor(busySlots: TimeSlot[] = []) {
    this.busySlots = busySlots;
  }

  public async getFreeSlots(calendarIds: string[]): Promise<TimeSlot[]> {
    return findFreeSlots(this.busySlots, new Date(), 7);
  }
}

import { TimeSlot } from './types';

export interface GoogleCalendarClient {
  getFreeSlots(calendarIds: string[]): Promise<TimeSlot[]>;
}

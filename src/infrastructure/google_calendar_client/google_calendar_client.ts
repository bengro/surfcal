import { TimeSlot } from './types';

export interface GoogleCalendarClient {
  getBusySlots(calendarIds: string[]): Promise<TimeSlot[]>;
}

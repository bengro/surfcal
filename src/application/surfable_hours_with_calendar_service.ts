import { SurfableHour, SurfCriteria } from '../domain/types';
import { getSurfableHours } from '../domain/get_surfable_hours';
import { CalendarFilterService } from '../domain/calendar_filter_service';
import { SurflineClient } from '../infrastructure/surfline_client/surfline_client';
import { GoogleCalendarClient } from '../infrastructure/google_calendar_client/google_calendar_client';

export interface SurfableHoursWithCalendarOptions {
  spotIds: string[];
  days: number;
  now: number;
  calendarIds?: string[];
  criteria?: SurfCriteria;
}

export class SurfableHoursWithCalendarService {
  constructor(
    private surflineClient: SurflineClient,
    private googleCalendarClient?: GoogleCalendarClient,
  ) {}

  async getSurfableHoursWithCalendarFiltering(
    options: SurfableHoursWithCalendarOptions,
  ): Promise<SurfableHour[]> {
    // First, get all surfable hours from Surfline
    const surfableHours = await getSurfableHours(
      options.spotIds,
      this.surflineClient,
      options.days,
      options.now,
      options.criteria,
    );

    // If no calendar filtering is requested, return all surfable hours
    if (
      !this.googleCalendarClient ||
      !options.calendarIds ||
      options.calendarIds.length === 0
    ) {
      return surfableHours;
    }

    // Get free slots from Google Calendar
    const busySlots = await this.googleCalendarClient.getBusySlots(
      options.calendarIds,
    );

    // Use domain service to mark calendar conflicts in surfable hours
    const markedSurfableHours = CalendarFilterService.markCalendarConflicts(
      surfableHours,
      busySlots,
    );

    return markedSurfableHours;
  }
}

import { SurfableHour } from './types';
import { TimeSlot } from '../infrastructure/google_calendar_client/types';

/**
 * Domain service for filtering surfable hours based on calendar availability
 */
export class CalendarFilterService {
  /**
   * Marks surfable hours that conflict with busy calendar slots
   * @param surfableHours - Array of surfable hours to mark
   * @param busySlots - Array of busy time slots from calendar
   * @returns Array of surfable hours with calendar conflicts marked
   */
  static markCalendarConflicts(
    surfableHours: SurfableHour[],
    busySlots: TimeSlot[],
  ): SurfableHour[] {
    return surfableHours.map((surfableHour) => ({
      ...surfableHour,
      calendarConflict: this.conflictsWithBusySlots(surfableHour, busySlots),
    }));
  }

  /**
   * Checks if a surfable hour conflicts with any of the busy calendar slots
   * @param surfableHour - The surfable hour to check
   * @param busySlots - Array of busy time slots from calendar
   * @returns true if the surfable hour conflicts with any busy slot
   */
  private static conflictsWithBusySlots(
    surfableHour: SurfableHour,
    busySlots: TimeSlot[],
  ): boolean {
    const surfStart = new Date(surfableHour.startTime * 1000);
    const surfEnd = new Date(surfableHour.endTime * 1000);

    return busySlots.some((busySlot) => {
      // Check if there's any overlap between surfable hour and busy slot
      // Two time ranges overlap if: start1 < end2 && start2 < end1
      return surfStart < busySlot.end && busySlot.start < surfEnd;
    });
  }
}

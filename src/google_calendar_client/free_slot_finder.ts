import { TimeSlot } from './types';

export function findFreeSlots(
  busySlots: TimeSlot[],
  now: Date,
  daysIntoFuture: number
): TimeSlot[] {
  const freeSlots: TimeSlot[] = [];
  const endOfSearchWindow = new Date(now);
  endOfSearchWindow.setDate(now.getDate() + daysIntoFuture);

  // Sort busy slots by start time
  const sortedBusySlots = busySlots.sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  let searchStart = now;

  for (const busySlot of sortedBusySlots) {
    if (busySlot.start > searchStart) {
      freeSlots.push({ start: searchStart, end: busySlot.start });
    }
    searchStart = busySlot.end > searchStart ? busySlot.end : searchStart;
  }

  if (searchStart < endOfSearchWindow) {
    freeSlots.push({ start: searchStart, end: endOfSearchWindow });
  }

  return freeSlots;
}

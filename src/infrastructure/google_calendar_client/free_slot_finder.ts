import { TimeSlot } from './types';

export function findFreeSlots(
  busySlots: TimeSlot[],
  now: Date,
  daysIntoFuture: number,
): TimeSlot[] {
  const freeSlots: TimeSlot[] = [];
  const endOfSearchWindow = calculateMaxTime(now, daysIntoFuture);

  const sortedBusySlots = busySlots.sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
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

  return removeShortWindows(freeSlots);
}

const calculateMaxTime = (now: Date, daysIntoFuture: number) => {
  const endOfSearchWindow = new Date(now);
  endOfSearchWindow.setDate(now.getDate() + daysIntoFuture);
  return endOfSearchWindow;
};

const removeShortWindows = (freeSlots: TimeSlot[]): TimeSlot[] => {
  return freeSlots.filter((slot) => {
    const durationInMs = slot.end.getTime() - slot.start.getTime();
    const durationInHours = durationInMs / (1000 * 60 * 60);
    return durationInHours >= 2;
  });
};

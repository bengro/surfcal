import { findFreeSlots } from './free_slot_finder';
import { TimeSlot } from './types';

describe('findFreeSlots', () => {
  it('should return a single free slot when there are no busy slots', () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const busySlots: TimeSlot[] = [];
    const freeSlots = findFreeSlots(busySlots, now, 7);
    const expectedEndOfSearchWindow = new Date(now);
    expectedEndOfSearchWindow.setDate(now.getDate() + 7);

    expect(freeSlots).toEqual([
      {
        start: now,
        end: expectedEndOfSearchWindow,
      },
    ]);
  });

  it('should return the correct free slots when there is one busy slot', () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const busySlots: TimeSlot[] = [
      {
        start: new Date('2025-01-02T10:00:00.000Z'),
        end: new Date('2025-01-02T12:00:00.000Z'),
      },
    ];
    const freeSlots = findFreeSlots(busySlots, now, 7);
    const expectedEndOfSearchWindow = new Date(now);
    expectedEndOfSearchWindow.setDate(now.getDate() + 7);

    expect(freeSlots).toEqual([
      {
        start: now,
        end: new Date('2025-01-02T10:00:00.000Z'),
      },
      {
        start: new Date('2025-01-02T12:00:00.000Z'),
        end: expectedEndOfSearchWindow,
      },
    ]);
  });

  it('should handle overlapping busy slots', () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const busySlots: TimeSlot[] = [
      {
        start: new Date('2025-01-02T10:00:00.000Z'),
        end: new Date('2025-01-02T12:00:00.000Z'),
      },
      {
        start: new Date('2025-01-02T11:00:00.000Z'),
        end: new Date('2025-01-02T13:00:00.000Z'),
      },
    ];
    const freeSlots = findFreeSlots(busySlots, now, 7);
    const expectedEndOfSearchWindow = new Date(now);
    expectedEndOfSearchWindow.setDate(now.getDate() + 7);

    expect(freeSlots).toEqual([
      {
        start: now,
        end: new Date('2025-01-02T10:00:00.000Z'),
      },
      {
        start: new Date('2025-01-02T13:00:00.000Z'),
        end: expectedEndOfSearchWindow,
      },
    ]);
  });
});

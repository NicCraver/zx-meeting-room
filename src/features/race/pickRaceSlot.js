import { findSlotOccupant } from "../booking/bookingConflict.js";
import { fromMinutes, toMinutes, TL } from "../booking/time.js";

const STEP = 30;

/** 看板里找第一段可订的 30 分钟，给并发抢订测试用。 */
export const pickFirstFreeSlot = (
  rooms,
  { dateIso, todayIso, nowMin = 0, duration = STEP } = {}
) => {
  for (const room of rooms || []) {
    const openStart = toMinutes(room.openStart || "07:00");
    const openEnd = toMinutes(room.openEnd || "23:00");
    let cursor = openStart;
    if (dateIso && todayIso && dateIso === todayIso) {
      cursor = Math.max(cursor, TL.nextOpen(nowMin, openStart));
    }
    for (let start = cursor; start + duration <= openEnd; start += STEP) {
      const end = start + duration;
      if (findSlotOccupant(room.busyEvents, start, end)) continue;
      return {
        roomId: room.id,
        roomName: room.name,
        dateIso,
        start,
        end,
        startHm: fromMinutes(start),
        endHm: fromMinutes(end)
      };
    }
  }
  return null;
};

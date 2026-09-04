import { toMinutes } from "./time.js";

/** 半开区间重叠。 */
export const slotsOverlap = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

export const findSlotOccupant = (busyEvents, start, end, ignoreId) => {
  for (const ev of busyEvents || []) {
    if (ignoreId && (ev.id === ignoreId || ev.bookingId === ignoreId)) continue;
    const a = toMinutes(ev.start);
    const b = toMinutes(ev.end);
    if (slotsOverlap(start, end, a, b)) return ev;
  }
  return null;
};

export const occupantName = (ev) => {
  if (!ev) return "";
  return (
    String(ev.host || ev.hostUserName || ev.title || "他人").trim() || "他人"
  );
};

export const conflictMessage = (ev) => {
  if (!ev) return "";
  return `该时段已被 ${occupantName(ev)} 占用`;
};

export const canSubmitBooking = ({
  room,
  start,
  end,
  conflictText,
  submitting,
  occupancyLoading
}) =>
  Boolean(
    room &&
    Number(end) - Number(start) >= 30 &&
    !conflictText &&
    !submitting &&
    !occupancyLoading
  );

/**
 * 冲突校验必须用「预约日」的占用，不能拿看板日的 busyEvents 去套别的日期。
 * 日视图 room.busyEvents 只属于 boardDateIso；周视图用 weekDays[].date。
 * fetchedBusy 为 getBoard(预约日) 的结果（含空数组）；null 表示还没拉过。
 * 返回 fetch:true 时调用方必须 getBoard(bookingDateIso) 再校验。
 */
export const occupancySource = ({
  bookingDateIso,
  boardDateIso,
  room,
  fetchedBusy = null
}) => {
  if (fetchedBusy !== null && fetchedBusy !== undefined) {
    return { events: fetchedBusy, fetch: false };
  }
  if (!room) return { events: [], fetch: false };
  if (Array.isArray(room.weekDays) && room.weekDays.length) {
    const day = room.weekDays.find((d) => d.date === bookingDateIso);
    if (day) return { events: day.busyEvents || [], fetch: false };
    return { events: [], fetch: true };
  }
  if (bookingDateIso && boardDateIso && bookingDateIso === boardDateIso) {
    return { events: room.busyEvents || [], fetch: false };
  }
  return { events: [], fetch: true };
};

import { toMinutes } from "./time.js";

/** 半开区间重叠。 */
export const slotsOverlap = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

export const findSlotOccupant = (busyEvents, start, end) => {
  for (const ev of busyEvents || []) {
    const a = toMinutes(ev.start);
    const b = toMinutes(ev.end);
    if (slotsOverlap(start, end, a, b)) return ev;
  }
  return null;
};

export const occupantName = (ev) => {
  if (!ev) return "";
  return String(ev.host || ev.hostUserName || ev.title || "他人").trim() || "他人";
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
  submitting
}) =>
  Boolean(room && Number(end) - Number(start) >= 30 && !conflictText && !submitting);

import { fromMinutes, TL } from "./time.js";

/** 预约弹窗时间列表步进（飞书式 15 分钟） */
export const TIME_PICK_SNAP = 15;

export const compactDuration = (start, end) => {
  const total = Math.max(0, end - start);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}小时${m}分钟`;
  if (h) return `${h}小时`;
  return `${m}分钟`;
};

export const startTimeOptions = (snap = TIME_PICK_SNAP) => {
  const out = [];
  for (let m = 0; m < TL.DAY_MIN; m += snap) out.push(m);
  return out;
};

export const endTimeOptions = (start, snap = TIME_PICK_SNAP) => {
  const out = [];
  for (let m = start + snap; m <= TL.DAY_MIN; m += snap) {
    out.push({
      value: m,
      label: fromMinutes(m),
      duration: compactDuration(start, m)
    });
  }
  return out;
};

export const keepDurationEnd = (prevStart, prevEnd, nextStart) => {
  const duration = Math.max(TIME_PICK_SNAP, prevEnd - prevStart);
  const end = Math.min(TL.DAY_MIN, nextStart + duration);
  if (end - nextStart < TIME_PICK_SNAP) {
    return Math.min(TL.DAY_MIN, nextStart + TIME_PICK_SNAP);
  }
  return end;
};

import { addDays, fromMinutes, toMinutes, TL } from "./time.js";
import { draftFromGrid } from "./bookingDefaults.js";

const STEP = 30;

export const parseFindFreeQuery = (text, { todayIso, nowMin = 0 } = {}) => {
  const raw = String(text || "");
  const q = {
    raw,
    dateIso: null,
    durationMin: 60,
    capacity: null,
    facilities: [],
    buildingName: null,
    floorName: null,
    windowStart: null,
    windowEnd: null
  };

  if (/今天/.test(raw)) q.dateIso = todayIso;
  else if (/明天/.test(raw)) q.dateIso = addDays(todayIso, 1);
  else if (/后天/.test(raw)) q.dateIso = addDays(todayIso, 2);

  if (/上午/.test(raw)) {
    q.windowStart = "09:00";
    q.windowEnd = "12:00";
  } else if (/下午/.test(raw)) {
    q.windowStart = "13:00";
    q.windowEnd = "18:00";
  } else if (/晚上/.test(raw)) {
    q.windowStart = "18:00";
    q.windowEnd = "21:00";
  }

  const hm = raw.match(/(\d{1,2}):(\d{2})/);
  const dian = raw.match(/(\d{1,2})\s*点/);
  if (hm || dian) {
    let h = hm ? Number(hm[1]) : Number(dian[1]);
    const m = hm ? Number(hm[2]) : 0;
    if (/下午|晚上/.test(raw) && h > 0 && h < 12) h += 12;
    const start = h * 60 + m;
    q.windowStart = fromMinutes(start);
    q.windowEnd = fromMinutes(Math.min(TL.DAY_MIN, start + 60));
  }

  const cap = raw.match(/(\d+)\s*人/);
  if (cap) q.capacity = Number(cap[1]);
  else if (/大会议/.test(raw)) q.capacity = 10;

  const hourDur = raw.match(/(\d+(?:\.\d+)?)\s*小时/);
  const minDur = raw.match(/(\d+)\s*分钟/);
  if (hourDur) q.durationMin = Math.max(STEP, Math.round(Number(hourDur[1]) * 60));
  else if (minDur) q.durationMin = Math.max(STEP, Number(minDur[1]));

  for (const name of ["投影", "白板", "电视"]) {
    if (raw.includes(name)) q.facilities.push(name);
  }
  if (/视频/.test(raw) && !q.facilities.includes("电视")) q.facilities.push("电视");

  const floor = raw.match(/(\d+)\s*楼/);
  if (floor) q.floorName = `${floor[1]}楼`;
  if (/奥城/.test(raw)) q.buildingName = "奥城";
  if (/生态城/.test(raw)) q.buildingName = "生态城";

  void nowMin;
  return q;
};

export const dateAskOptions = (todayIso) => [
  { label: "今天", patch: { dateIso: todayIso } },
  { label: "明天", patch: { dateIso: addDays(todayIso, 1) } },
  { label: "后天", patch: { dateIso: addDays(todayIso, 2) } }
];

export const nextMissingFindFreeField = (query, { todayIso } = {}) => {
  if (!query.dateIso) {
    return {
      field: "date",
      text: "你想哪天开会？",
      options: dateAskOptions(todayIso)
    };
  }
  return null;
};

const intersects = (a0, a1, b0, b1) => a0 < b1 && a1 > b0;

const roomMatches = (room, query) => {
  if (query.capacity != null && room.capacity < query.capacity) return false;
  if (query.buildingName && !String(room.buildingName).includes(query.buildingName)) {
    return false;
  }
  if (query.floorName && !String(room.floorName).includes(query.floorName.replace("楼", ""))) {
    return false;
  }
  if (query.facilities?.length) {
    const set = new Set(room.facilities || []);
    if (!query.facilities.every((f) => set.has(f))) return false;
  }
  return true;
};

const computeSlots = (openStart, openEnd, busy, durationMin, windowStart, windowEnd) => {
  const slots = [];
  for (let start = openStart; start + durationMin <= openEnd; start += STEP) {
    const end = start + durationMin;
    if (windowStart != null && start < windowStart) continue;
    if (windowEnd != null && end > windowEnd) continue;
    const hit = busy.some((b) => intersects(start, end, b.start, b.end));
    if (!hit) slots.push({ start, end });
  }
  return slots;
};

export const searchFreeSlots = (rooms, query, now) => {
  const durationMin = query.durationMin || 60;
  const windowStart = query.windowStart ? toMinutes(query.windowStart) : null;
  const windowEnd = query.windowEnd ? toMinutes(query.windowEnd) : null;
  const date = query.dateIso;
  const out = [];

  for (const room of rooms || []) {
    if (!roomMatches(room, query)) continue;
    if (date < now.date) continue;
    let rangeStart = toMinutes(room.openStart || "09:00");
    const rangeEnd = toMinutes(room.openEnd || "18:00");
    if (date === now.date) {
      rangeStart = Math.max(rangeStart, Math.ceil(now.minute / STEP) * STEP);
    }
    const busy = (room.busyEvents || []).map((e) => ({
      start: toMinutes(e.start),
      end: toMinutes(e.end)
    }));
    const slotRanges = computeSlots(
      rangeStart,
      rangeEnd,
      busy,
      durationMin,
      windowStart,
      windowEnd
    );
    if (!slotRanges.length) continue;
    out.push({
      roomId: room.id,
      roomName: room.name,
      buildingName: room.buildingName,
      floorName: room.floorName,
      capacity: room.capacity,
      facilities: room.facilities || [],
      openStart: room.openStart,
      openEnd: room.openEnd,
      busy: (room.busyEvents || []).map((e) => ({ start: e.start, end: e.end })),
      slots: slotRanges.slice(0, 4).map((s) => ({
        roomId: room.id,
        roomName: room.name,
        buildingName: room.buildingName,
        floorName: room.floorName,
        capacity: room.capacity,
        facilities: room.facilities || [],
        date,
        start: fromMinutes(s.start),
        end: fromMinutes(s.end)
      }))
    });
  }
  out.sort((a, b) => b.slots.length - a.slots.length);
  const heading = query.windowStart
    ? `${date} · ${query.windowStart}–${query.windowEnd}`
    : `${date} · 空闲 ≥ ${durationMin / 60} 小时`;
  return { heading, rooms: out.slice(0, 5) };
};

export const fallbackAdvice = (rooms, query, now) => {
  const relaxed = searchFreeSlots(
    rooms,
    { ...query, capacity: null, facilities: [], buildingName: null, floorName: null, windowStart: null, windowEnd: null },
    now
  );
  const first = relaxed.rooms[0]?.slots[0];
  if (!first) return "该时段没有空闲会议室，试试换一天或缩短时长";
  const other = relaxed.rooms.find((r) => r.roomId !== first.roomId)?.slots[0];
  if (other) {
    return `该时段没有空闲会议室，最近的空闲时段是 ${first.start}，或 ${other.floorName}${other.roomName} ${other.start}-${other.end} 可用`;
  }
  return `该时段没有空闲会议室，最近的空闲时段是 ${first.start}`;
};

export const slotToBookingDraft = (slot, rooms) => {
  const room =
    (rooms || []).find((r) => r.id === slot.roomId) || {
      id: slot.roomId,
      name: slot.roomName,
      buildingName: slot.buildingName,
      floorName: slot.floorName,
      capacity: slot.capacity,
      facilities: slot.facilities
    };
  return draftFromGrid({
    room,
    dateIso: slot.date,
    start: toMinutes(slot.start),
    end: toMinutes(slot.end)
  });
};

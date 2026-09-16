import { defaultBookingTitle } from "@/features/booking/defaultTitle";
import { shanghaiToday } from "@/features/booking/time";
import { searchFreeSlots } from "./findFree.js";
import { shanghaiNowMinutes } from "./tools/searchAvailability.js";

const bookingApi = () => import("@/api/module/booking");

const suggestFromBoard = async (date, durationMin, getBoardFn, now) => {
  const data = await getBoardFn(date);
  const found = searchFreeSlots(
    Array.isArray(data?.rooms) ? data.rooms : [],
    { dateIso: date, durationMin: durationMin || 60 },
    now || { date: shanghaiToday(), minute: shanghaiNowMinutes() }
  );
  const options = [];
  for (const room of found.rooms || []) {
    for (const slot of room.slots || []) {
      options.push(slot);
      if (options.length >= 4) return options;
    }
  }
  return options;
};

const durationOf = (slot) => {
  const [sh, sm] = String(slot.start || "00:00")
    .split(":")
    .map(Number);
  const [eh, em] = String(slot.end || "00:00")
    .split(":")
    .map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

/**
 * 点确认预定：只在这里 createBooking。冲突则本地再查档出 suggest。
 */
export async function confirmBookingAction(draft, title, deps = {}) {
  const slot = draft?.slot;
  if (!slot) {
    throw Object.assign(new Error("没有待确认草稿"), { code: "NO_DRAFT" });
  }
  const book = deps.createBooking || (await bookingApi()).createBooking;
  const userName = deps.userName || "";
  const finalTitle =
    String(title || "")
      .trim()
      .slice(0, 50) || defaultBookingTitle(userName);
  try {
    const result = await book({
      roomId: slot.roomId,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      title: finalTitle
    });
    const bookingId = result?.id || result?.items?.[0]?.id || "";
    return {
      type: "booked",
      bookingId,
      title: finalTitle,
      slot,
      expression: "happy"
    };
  } catch (err) {
    if (err?.code === "M4010") {
      const fetchBoard = deps.getBoard || (await bookingApi()).getBoard;
      const options = await suggestFromBoard(
        slot.date,
        durationOf(slot),
        fetchBoard,
        deps.now
      );
      return {
        type: "suggest",
        reason: err.msg || "该时段已被占用",
        options,
        expression: "sorry"
      };
    }
    throw err;
  }
}

export async function confirmReleaseAction(booking, deps = {}) {
  if (!booking?.id) {
    throw Object.assign(new Error("没有待释放的预定"), { code: "NO_RELEASE" });
  }
  const release = deps.releaseBooking || (await bookingApi()).releaseBooking;
  await release(booking.id);
  return {
    type: "booked",
    bookingId: booking.id,
    title: `已释放「${booking.title || ""}」`,
    slot: {
      roomId: booking.roomId,
      roomName: booking.roomName,
      date: booking.date,
      start: booking.start,
      end: booking.end
    },
    expression: "happy"
  };
}

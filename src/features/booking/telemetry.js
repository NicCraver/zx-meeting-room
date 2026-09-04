const EVENT_NAMES = new Set([
  "page_view",
  "booking_open",
  "booking_submit",
  "booking_fail",
  "booking_release",
  "agent_chip",
  "agent_message",
  "agent_result",
  "agent_pick",
  "agent_confirm",
  "agent_back",
  "agent_booked",
  "agent_fail"
]);

const MAX_BATCH = 20;
const queue = [];
let flushTimer = 0;
let flushing = false;

export const TELEMETRY_EVENT_NAMES = EVENT_NAMES;

export const sanitizeProps = (eventName, props) => {
  if (!props || typeof props !== "object" || Array.isArray(props)) return undefined;
  const out = { ...props };
  delete out.text;
  delete out.message;
  if (eventName === "agent_message" && typeof out.len !== "number") {
    out.len = 0;
  }
  return out;
};

export const isAllowedEvent = (name) => EVENT_NAMES.has(name);

const newEventId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const pagePath = () => {
  if (typeof location === "undefined") return "/";
  return location.pathname.replace(/^\/meeting/, "") || "/";
};

const authQuery = () => {
  if (typeof sessionStorage === "undefined") return "";
  const accountId = sessionStorage.getItem("zxAccountId") || "";
  const corpId =
    sessionStorage.getItem("meetingCorpId") ||
    sessionStorage.getItem("zxCorpId") ||
    "";
  if (!accountId || !corpId) return "";
  const q = new URLSearchParams({
    zxAccountId: accountId,
    zxCorpId: corpId,
    zxClientType: sessionStorage.getItem("clientType") || "app"
  });
  return `?${q.toString()}`;
};

export const track = (eventName, props) => {
  if (!isAllowedEvent(eventName)) return;
  queue.push({
    eventId: newEventId(),
    eventName,
    eventAt: new Date().toISOString(),
    page: pagePath(),
    props: sanitizeProps(eventName, props)
  });
  scheduleFlush();
};

const scheduleFlush = () => {
  if (flushTimer || typeof window === "undefined") return;
  flushTimer = window.setTimeout(() => {
    flushTimer = 0;
    flush();
  }, 400);
};

export const flush = async () => {
  if (flushing || !queue.length || typeof fetch === "undefined") return;
  flushing = true;
  const batch = queue.splice(0, MAX_BATCH);
  try {
    await fetch(`/meetingApi/events${authQuery()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true
    });
  } catch {
    /* 遥测失败不打扰用户 */
  } finally {
    flushing = false;
    if (queue.length) scheduleFlush();
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (!queue.length) return;
    const batch = queue.splice(0, MAX_BATCH);
    const qs = authQuery();
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/meetingApi/events${qs}`,
          new Blob([JSON.stringify({ events: batch })], {
            type: "application/json"
          })
        );
      }
    } catch {
      /* ignore */
    }
  });
}

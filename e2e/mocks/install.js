import { aiMeetSseFrames } from "./aiMeetSse.js";

const MEETING_PREFIXES = ["/api/contact/v1/meetingRoom", "/meetingApi"];

const meetingPath = (url) => {
  const u = new URL(url);
  for (const prefix of MEETING_PREFIXES) {
    const idx = u.pathname.indexOf(prefix);
    if (idx >= 0) return u.pathname.slice(idx + prefix.length) || "/";
  }
  return u.pathname;
};

const readBody = (request) => {
  const raw = request.postData();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const queryOf = (url) => Object.fromEntries(new URL(url).searchParams.entries());

const fulfillJson = (route, result) =>
  route.fulfill({
    status: result.status || 200,
    contentType: "application/json",
    body: JSON.stringify(result.json)
  });

const fulfillSse = (route, frames) => {
  const body = (frames || [])
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join("");
  return route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body
  });
};

/**
 * 拦截会议室接口与 /aiChatApi。未识别路径回 M9999，避免 25s 空等。
 */
export async function installMeetingApi(page, store) {
  const handleMeeting = async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    const path = meetingPath(request.url());
    const delay = path === "/bookings/create" ? store.state.flags.delayCreateMs : 0;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const result = store.handle(method, path, {
      query: queryOf(request.url()),
      body: readBody(request)
    });
    if (result.sse) {
      await fulfillSse(route, result.sse);
      return;
    }
    await fulfillJson(route, result);
  };
  await page.route("**/meetingApi/**", handleMeeting);
  await page.route("**/api/contact/v1/meetingRoom/**", handleMeeting);

  await page.route("**/aiChatApi/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    if (request.url().includes("/v1/aiMeet")) {
      await fulfillSse(route, aiMeetSseFrames(readBody(request)));
      return;
    }
    await fulfillJson(route, {
      status: 200,
      json: { code: "M9999", data: null, msg: "未 mock 的路径: aiChatApi" }
    });
  });
}

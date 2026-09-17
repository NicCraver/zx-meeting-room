import { shanghaiToday } from "@/features/booking/time";
import { cardsFromLoop } from "./cardsFromLoop.js";
import { runAgentLoop } from "./runAgentLoop.js";
import { runAgentTool } from "./runTool.js";
import { buildMeetingSystemPrompt } from "./systemPrompt.js";
import { MEETING_TOOLS } from "./tools/meetingTools.js";

/**
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {(payload: object) => Promise<object>} opts.complete
 * @param {AbortSignal} [opts.signal]
 * @param {(event: object) => void} [opts.onEvent]
 * @param {typeof runAgentTool} [opts.runTool]
 * @param {string} [opts.todayIso]
 */
export async function runMeetingAgent({
  prompt,
  complete,
  signal,
  onEvent,
  runTool,
  todayIso
}) {
  const today = todayIso || shanghaiToday();
  const result = await runAgentLoop({
    prompt,
    systemPrompt: buildMeetingSystemPrompt({ todayIso: today }),
    tools: MEETING_TOOLS,
    complete: async (payload) => {
      if (signal?.aborted) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      return complete(payload);
    },
    runTool: (call) => (runTool || runAgentTool)(call),
    onEvent
  });
  const event = cardsFromLoop({
    log: result.log,
    answer: result.answer,
    prompt
  });
  return {
    event,
    issuedRooms: event.rooms || [],
    answer: result.answer,
    log: result.log,
    rounds: result.rounds
  };
}

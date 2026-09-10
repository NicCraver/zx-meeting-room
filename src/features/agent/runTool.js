import { runAddTool } from "./tools/add.js";
import { runListMyMeetingsTool } from "./tools/listMyMeetings.js";
import { runMultiplyTool } from "./tools/multiply.js";
import { runPrepareReleaseTool } from "./tools/prepareRelease.js";
import { runSearchAvailabilityTool } from "./tools/searchAvailability.js";

/**
 * @param {{ name?: string, arguments?: string }} call
 * @param {object} [deps]
 */
export async function runAgentTool(call, deps = {}) {
  const name = call?.name;
  try {
    if (name === "add") {
      return String(runAddTool(call.arguments));
    }
    if (name === "multiply") {
      return String(runMultiplyTool(call.arguments));
    }
    if (name === "search_availability") {
      return await runSearchAvailabilityTool(call.arguments, deps);
    }
    if (name === "list_my_meetings") {
      return await runListMyMeetingsTool(call.arguments, deps);
    }
    if (name === "prepare_release") {
      return await runPrepareReleaseTool(call.arguments, deps);
    }
    throw new Error(`未知工具：${name || "(empty)"}`);
  } catch (err) {
    if (name === "add" || name === "multiply") throw err;
    return JSON.stringify({ error: err?.message || String(err) });
  }
}

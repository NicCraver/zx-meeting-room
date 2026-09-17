import { LIST_MY_MEETINGS_TOOL } from "./listMyMeetings.js";
import { PREPARE_RELEASE_TOOL } from "./prepareRelease.js";
import { SEARCH_AVAILABILITY_TOOL } from "./searchAvailability.js";

/** 正式助手暴露给模型的工具表；禁止 create/release。 */
export const MEETING_TOOLS = [
  SEARCH_AVAILABILITY_TOOL,
  LIST_MY_MEETINGS_TOOL,
  PREPARE_RELEASE_TOOL
];

/**
 * 客户端 agent 循环：kind=tool_call 就执行工具，把结果作为 toolResults 再打 /v1/aiMeet，直到 kind=text。
 * 服务端不执行工具、不持会话；每次请求带上原始 prompt + 已累积的 toolResults。
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} [opts.systemPrompt]
 * @param {object[]} opts.tools
 * @param {(payload: object) => Promise<object>} opts.complete
 * @param {(call: { name?: string, arguments?: string, callId?: string }) => string | Promise<string>} opts.runTool
 * @param {(event: object) => void} [opts.onEvent]
 * @param {number} [opts.maxRounds]
 */
export async function runAgentLoop({
  prompt,
  systemPrompt,
  tools,
  complete,
  runTool,
  onEvent,
  maxRounds = 8
}) {
  const toolResults = [];
  const log = [];
  for (let round = 1; round <= maxRounds; round++) {
    const payload = {
      prompt,
      systemPrompt,
      tools,
      toolChoice: "auto"
    };
    if (toolResults.length) {
      payload.toolResults = toolResults.map((row) => ({ ...row }));
    }
    onEvent?.({ type: "llm-start", round, payload });
    const data = await complete(payload);
    log.push({
      step: `llm-${round}`,
      kind: data?.kind,
      answer: data?.answer,
      toolCalls: data?.toolCalls,
      responseId: data?.responseId
    });
    onEvent?.({ type: "llm-done", round, data });
    if (data?.kind !== "tool_call") {
      return { answer: data?.answer, log, rounds: round };
    }
    const calls = data.toolCalls || [];
    if (!calls.length) {
      throw new Error("kind=tool_call 但没有 toolCalls");
    }
    for (const call of calls) {
      const output = String(await runTool(call));
      toolResults.push({
        callId: call.callId,
        name: call.name,
        arguments: call.arguments,
        output
      });
      log.push({
        step: `tool-${round}-${call.name}`,
        name: call.name,
        callId: call.callId,
        arguments: call.arguments,
        output
      });
      onEvent?.({ type: "tool", round, call, output });
    }
  }
  throw new Error(`超过 ${maxRounds} 轮仍未得到文本回答`);
}

import { ref } from "vue";

export function createProcessTrace() {
  const steps = [];
  let seq = 0;

  const push = (row) => {
    const step = {
      id: ++seq,
      kind: row.kind,
      title: row.title,
      detail: row.detail || "",
      stream: row.stream || "",
      pending: Boolean(row.pending),
      resultKind: row.resultKind || ""
    };
    steps.push(step);
    return step.id;
  };

  const patch = (id, extra) => {
    const step = steps.find((item) => item.id === id);
    if (!step) return;
    if (extra.title != null) step.title = extra.title;
    if (extra.detail != null) step.detail = extra.detail;
    if (extra.stream != null) step.stream = extra.stream;
    if (extra.pending != null) step.pending = extra.pending;
    if (extra.kind != null) step.kind = extra.kind;
    if (extra.resultKind != null) step.resultKind = extra.resultKind;
    if (extra.syncAnswer && !step.stream) {
      step.stream = extra.syncAnswer;
    }
  };

  const appendStream = (id, delta) => {
    const step = steps.find((item) => item.id === id);
    if (step && delta) {
      step.stream += delta;
    }
  };

  return {
    steps,
    push,
    patch,
    appendStream,
    reset: () => {
      steps.splice(0, steps.length);
      seq = 0;
    },
    snapshot: () => steps.map((item) => ({ ...item }))
  };
}

export function formatLlmRequest(payload) {
  const tools = (payload.tools || []).map((item) => item.name).join("、") || "无";
  const results = payload.toolResults || [];
  const lines = [
    `toolChoice: ${payload.toolChoice || "(默认)"}`,
    `tools: ${tools}`,
    `已回传 toolResults: ${results.length} 条`
  ];
  if (results.length) {
    lines.push(
      results
        .map((row) => `  ${row.name} callId=${row.callId} → ${row.output}`)
        .join("\n")
    );
  }
  lines.push(`prompt:\n${payload.prompt || ""}`);
  return lines.join("\n");
}

export function formatLlmDone(data) {
  if (!data) return "";
  if (data.kind === "tool_call") {
    const calls = data.toolCalls || [];
    return calls
      .map(
        (call) =>
          `${call.name} callId=${call.callId || "-"}\narguments: ${call.arguments || ""}`
      )
      .join("\n\n");
  }
  return data.answer ? `answer: ${data.answer}` : "";
}

export function formatToolRun(call, output) {
  return `arguments: ${call.arguments || ""}\noutput: ${output}`;
}

/** Vue 侧用：每次改动换新 snapshot，保证列表能刷新 */
export function useProcessTrace() {
  const inner = createProcessTrace();
  const steps = ref([]);
  const sync = () => {
    steps.value = inner.snapshot();
  };
  return {
    steps,
    reset: () => {
      inner.reset();
      sync();
    },
    push: (row) => {
      const id = inner.push(row);
      sync();
      return id;
    },
    patch: (id, extra) => {
      inner.patch(id, extra);
      sync();
    },
    appendStream: (id, delta) => {
      inner.appendStream(id, delta);
      sync();
    }
  };
}

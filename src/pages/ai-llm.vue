<template>
  <div class="mx-auto max-w-180 p-6 text-black">
    <h1 class="mb-2 text-4.5 font-semibold">会议室 · 调 zx-ai-chat</h1>
    <p class="mb-4 text-3.5 text-body">
      地址带
      <code class="text-3">?userCode=...&amp;corpId=6</code>
      ，先换 token 再调
      <code class="text-3">POST /v1/aiMeet</code>
      （SSE）
    </p>
    <p class="mb-4 text-3.5" :class="ok ? 'text-success' : 'text-danger'">
      {{ status }}
    </p>
    <label class="mb-1 block text-3.5 text-body">提问</label>
    <textarea
      v-model="prompt"
      class="mb-3 box-border h-28 w-full resize-y rounded-2 border border-edge p-3 text-3.5"
      :disabled="!ok || busy"
    />
    <label class="mb-3 flex items-center gap-2 text-3.5 text-body">
      <input v-model="withAddTool" type="checkbox" :disabled="!ok || busy" />
      加法工具 add（模型出 tool_call，前端执行 a+b，再回给模型说一句）
    </label>
    <button
      type="button"
      class="rounded-2 bg-primary px-4 py-2 text-3.5 text-white disabled:opacity-50"
      :disabled="!ok || busy || !prompt.trim()"
      @click="ask"
    >
      {{ sending ? "生成中…" : "发给 aiMeet" }}
    </button>
    <AgentProcessTrace :steps="askSteps" />

    <hr class="my-8 border-edge" />
    <h2 class="mb-2 text-4 font-semibold">Agent 循环</h2>
    <p class="mb-4 text-3.5 text-body">
      真正的 while：<code class="text-3">kind=tool_call</code> 就执行工具，把
      <code class="text-3">toolResults</code> 连同原 prompt 再打
      <code class="text-3">/v1/aiMeet</code>，直到 <code class="text-3">kind=text</code>。
      本例会先 <code class="text-3">add</code> 再 <code class="text-3">multiply</code>。
    </p>
    <label class="mb-1 block text-3.5 text-body">循环提问</label>
    <textarea
      v-model="loopPrompt"
      class="mb-3 box-border h-28 w-full resize-y rounded-2 border border-edge p-3 text-3.5"
      :disabled="!ok || busy"
    />
    <button
      type="button"
      class="rounded-2 bg-primary px-4 py-2 text-3.5 text-white disabled:opacity-50"
      :disabled="!ok || busy || !loopPrompt.trim()"
      @click="askLoop"
    >
      {{ loopSending ? "循环中…" : "跑 agent 循环" }}
    </button>
    <AgentProcessTrace :steps="loopSteps" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getMyInfo, getTokenByCode, streamAiMeet } from "@/api";
import { getAccountId, getToken, setToken } from "@/utils";
import { setClientType } from "@/api/http";
import AgentProcessTrace from "@/features/agent/AgentProcessTrace.vue";
import {
  formatLlmDone,
  formatLlmRequest,
  formatToolRun,
  useProcessTrace
} from "@/features/agent/processTrace.js";
import { ADD_TOOL, runAddTool } from "@/features/agent/tools/add.js";
import { MULTIPLY_TOOL } from "@/features/agent/tools/multiply.js";
import { runAgentLoop } from "@/features/agent/runAgentLoop.js";
import { runAgentTool } from "@/features/agent/runTool.js";

const route = useRoute();
const router = useRouter();
const status = ref("正在用 userCode 换 token…");
const ok = ref(false);
const prompt = ref("用两三句话介绍怎么预定会议室。");
const withAddTool = ref(false);
const sending = ref(false);
const loopPrompt = ref(
  "请先用 add 计算 17 加 25，再用 multiply 把这个和乘以 2。每一步都要调工具，最后用中文说明全过程。"
);
const loopSending = ref(false);
const busy = computed(() => sending.value || loopSending.value);
const askTrace = useProcessTrace();
const loopTrace = useProcessTrace();
const askSteps = askTrace.steps;
const loopSteps = loopTrace.steps;

const pickErrorMsg = (err) => {
  if (!err) return "失败";
  if (typeof err === "string") return err;
  if (err.msg) return err.msg;
  if (err.message) return err.message;
  return "失败";
};

const requestLlm = async (trace, payload, title) => {
  const stepId = trace.push({
    kind: "llm",
    title,
    detail: formatLlmRequest(payload),
    pending: true
  });
  try {
    const data = await streamAiMeet(payload, {
      onDelta: (delta) => {
        trace.appendStream(stepId, delta);
      }
    });
    trace.patch(stepId, {
      pending: false,
      resultKind: data.kind || "",
      syncAnswer: data.kind === "text" ? data.answer || "" : "",
      title: `${title} → ${data.kind || "done"}`,
      detail: [formatLlmRequest(payload), formatLlmDone(data)]
        .filter(Boolean)
        .join("\n\n")
    });
    return data;
  } catch (err) {
    trace.patch(stepId, {
      pending: false,
      title: `${title} → 失败`,
      detail: `${formatLlmRequest(payload)}\n\n${pickErrorMsg(err)}`
    });
    throw err;
  }
};

onMounted(async () => {
  try {
    const userCode = String(route.query.userCode || "").trim();
    // bootstrapAuthFromUrl 会从地址栏摘掉 corpId 并写入 sessionStorage
    const corpId = String(
      route.query.corpId ||
        sessionStorage.getItem("meetingCorpId") ||
        sessionStorage.getItem("zxCorpId") ||
        ""
    ).trim();
    if (!corpId) {
      status.value =
        "缺少 corpId。地址请带 ?userCode=...&corpId=6 （userCode 一次性）";
      return;
    }
    sessionStorage.setItem("meetingCorpId", corpId);
    sessionStorage.setItem("zxCorpId", corpId);

    if (!getToken("access_token")) {
      if (!userCode) {
        status.value = "缺少 userCode，且本地没有 token";
        return;
      }
      const tokenRes = await getTokenByCode({ code: userCode });
      if (!tokenRes?.access_token) {
        status.value = "换 token 失败：回参没有 access_token";
        return;
      }
      setToken({
        access_token: tokenRes.access_token,
        refresh_token: tokenRes.refresh_token || ""
      });
      if (tokenRes.client_id) setClientType(tokenRes.client_id);
    }

    const me = await getMyInfo();
    if (!me?.id) {
      status.value = "get_my_info 没有账号 id";
      return;
    }
    sessionStorage.setItem("zxAccountId", String(me.id));
    const matchCorp = (me.corpUsers || []).find(
      (item) => String(item.corpId) === corpId
    );
    if (matchCorp?.id) {
      sessionStorage.setItem("meetingUserId", String(matchCorp.id));
    }

    if (userCode) {
      const next = { ...route.query };
      delete next.userCode;
      await router.replace({ path: route.path, query: next }).catch(() => {});
    }

    status.value = `已登录 accountId=${getAccountId()} corpId=${corpId}，可以发一句`;
    ok.value = true;
  } catch (err) {
    status.value = `换登录态失败：${pickErrorMsg(err)}`;
  }
});

const ask = async () => {
  sending.value = true;
  askTrace.reset();
  try {
    const userPrompt = prompt.value.trim();
    const payload = {
      prompt: userPrompt,
      systemPrompt:
        "你是计算器助手。任何加法都必须调用 add 工具，禁止口算。工具跑完后，要用中文说明你怎么借助工具算出结果，不要只回一个数字。"
    };
    if (withAddTool.value) {
      payload.tools = [ADD_TOOL];
      payload.toolChoice = "add";
    } else {
      payload.systemPrompt = "你是会议室助手。用简短中文回答。不要声称已经预定。";
    }
    const first = await requestLlm(askTrace, payload, "请求 LLM");

    if (withAddTool.value && first?.kind === "tool_call") {
      const addCall = (first.toolCalls || []).find((c) => c.name === "add");
      if (!addCall) {
        throw new Error("模型没有调用 add");
      }
      const sum = runAddTool(addCall.arguments);
      askTrace.push({
        kind: "tool",
        title: "执行工具 add",
        detail: formatToolRun(addCall, sum)
      });

      await requestLlm(
        askTrace,
        {
          prompt:
            `用户原话：${userPrompt}\n\n` +
            `你刚才调用了 add，入参 ${addCall.arguments}。前端已执行，结果是 ${sum}。` +
            `请用中文描述你怎么计算的，并给出得数。不要只回一个数字，不要再调工具。`,
          systemPrompt: "根据工具执行结果回答用户。要解释过程，不要再调工具。"
        },
        "请求 LLM（带回工具结果）"
      );
    }
  } catch (err) {
    askTrace.push({
      kind: "error",
      title: "出错",
      detail: pickErrorMsg(err)
    });
  } finally {
    sending.value = false;
  }
};

const LOOP_SYSTEM =
  "你是计算器助手。加法必须调用 add，乘法必须调用 multiply，禁止口算。" +
  "每次只调用当前需要的那一个工具。工具结果会由客户端回传。" +
  "全部算完后用中文说明全过程并给出最终得数，不要只回一个数字。";

const askLoop = async () => {
  loopSending.value = true;
  loopTrace.reset();
  let currentLlmId = 0;
  let lastRequestDetail = "";
  try {
    await runAgentLoop({
      prompt: loopPrompt.value.trim(),
      systemPrompt: LOOP_SYSTEM,
      tools: [ADD_TOOL, MULTIPLY_TOOL],
      complete: (payload) =>
        streamAiMeet(payload, {
          onDelta: (delta) => {
            if (currentLlmId) {
              loopTrace.appendStream(currentLlmId, delta);
            }
          }
        }),
      runTool: runAgentTool,
      onEvent: (event) => {
        if (event.type === "llm-start") {
          lastRequestDetail = formatLlmRequest(event.payload);
          currentLlmId = loopTrace.push({
            kind: "llm",
            title: `第 ${event.round} 轮 · 请求 LLM`,
            detail: lastRequestDetail,
            pending: true
          });
          return;
        }
        if (event.type === "llm-done") {
          loopTrace.patch(currentLlmId, {
            pending: false,
            resultKind: event.data?.kind || "",
            syncAnswer:
              event.data?.kind === "text" ? event.data?.answer || "" : "",
            title: `第 ${event.round} 轮 · LLM → ${event.data?.kind || "done"}`,
            detail: [lastRequestDetail, formatLlmDone(event.data)]
              .filter(Boolean)
              .join("\n\n")
          });
          return;
        }
        if (event.type === "tool") {
          loopTrace.push({
            kind: "tool",
            title: `第 ${event.round} 轮 · 执行工具 ${event.call?.name}`,
            detail: formatToolRun(event.call, event.output)
          });
        }
      }
    });
  } catch (err) {
    loopTrace.push({
      kind: "error",
      title: "出错",
      detail: pickErrorMsg(err)
    });
  } finally {
    loopSending.value = false;
  }
};
</script>

<template>
  <section
    class="booking-ai-bar"
    :class="{ 'is-lifted': lifted }"
    aria-label="会议室助手"
  >
    <form class="booking-ai-form" @submit.prevent="onSubmit">
      <textarea
        id="tour-ai-input"
        ref="inputRef"
        data-tour="ai-input"
        v-model="draft"
        rows="3"
        maxlength="200"
        class="booking-ai-input"
        :placeholder="placeholder"
        :disabled="sending"
        aria-label="对助手说"
        @focus="focused = true"
        @blur="focused = false"
        @keydown.enter.exact.prevent="onSubmit"
      />
      <button
        type="submit"
        class="booking-ai-send"
        :disabled="sending"
        :aria-label="sending ? '发送中' : '发送'"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
    </form>
    <div
      v-if="showShortcutChips"
      class="booking-ai-chips"
      role="list"
      aria-label="快捷指令"
    >
      <button
        v-for="chip in chips"
        :key="chip.id"
        type="button"
        class="booking-ai-chip"
        :data-tour="chip.id === 'find-free' ? 'chip-find-free' : undefined"
        :disabled="sending"
        role="listitem"
        @click="sendChip(chip)"
      >
        {{ chip.label }}
      </button>
    </div>

    <div v-if="ui.status" class="booking-ai-status" aria-live="polite">
      {{ ui.status }}
    </div>
    <p v-else-if="card?.type === 'need_more'" class="booking-ai-status">
      {{ card.text }}
    </p>
    <div
      v-else-if="card?.type === 'error'"
      class="booking-ai-status"
      role="alert"
    >
      <span>{{ card.msg }}</span>
      <AcButton title="重试" @click="retry" />
    </div>
    <el-scrollbar v-else-if="card" class="booking-ai-results">
      <AgentQueryCard
        v-if="card.type === 'query'"
        :heading="card.heading"
        :rooms="card.rooms"
        @pick="pickSlot"
        @book="pickSlot"
      />
      <AgentConfirmCard
        v-else-if="card.type === 'confirm'"
        :draft="card.draft"
        @confirm="confirmDraft"
        @cancel="goBack"
      />
      <article v-else-if="card.type === 'suggest'" class="ai-buddy-card">
        <h3 class="ai-buddy-card-title">换个时间？</h3>
        <p class="ai-buddy-card-copy">{{ card.reason }}</p>
        <div class="ai-buddy-slot-btns">
          <p class="ai-buddy-slot-hint">点选一个时段</p>
          <button
            v-for="opt in card.options"
            :key="`${opt.roomId}-${opt.date}-${opt.start}-${opt.end}`"
            type="button"
            class="ai-buddy-slot-btn"
            @click="pickSlot(opt)"
          >
            <span class="ai-buddy-slot-time"
              >{{ opt.roomName }} {{ opt.start }}–{{ opt.end }}</span
            >
            <span class="ai-buddy-slot-cta">选这个</span>
          </button>
        </div>
      </article>
      <article
        v-else-if="card.type === 'booked'"
        class="ai-buddy-card ai-buddy-card-ok"
        aria-label="预定成功"
      >
        <h3 class="ai-buddy-card-title">预定成功</h3>
        <p class="ai-buddy-card-copy">{{ bookedSummary }}</p>
        <div class="ai-buddy-card-actions">
          <button type="button" class="ai-buddy-btn-primary" @click="dismiss">
            知道了
          </button>
        </div>
      </article>
    </el-scrollbar>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElScrollbar } from "element-plus";
import { AcButton } from "@/components/base";
import { getUserName } from "@/utils";
import {
  AI_CHIPS,
  AI_PLACEHOLDER_INTERVAL_MS,
  AI_PLACEHOLDERS,
  nextPlaceholderIndex
} from "../aiChips.js";
import {
  applyAgentEvent,
  backFromConfirm,
  EMPTY_SLOT_IDLE_MS,
  emptyAgentUi,
  idleAfterEmptyResult,
  isEmptySlotNeedMore
} from "../applyEvent.js";
import { streamTurn } from "../streamTurn.js";
import { waitHintAt, waitHintsForAction } from "../waitHints.js";
import {
  trackAgentBack,
  trackAgentChip,
  trackAgentConfirm,
  trackAgentMessage,
  trackAgentPick,
  trackAgentStreamEvent
} from "../telemetry.js";
import { defaultBookingTitle } from "@/features/booking/defaultTitle.js";
import AgentConfirmCard from "./AgentConfirmCard.vue";
import AgentQueryCard from "./AgentQueryCard.vue";

defineProps({
  rooms: { type: Array, default: () => [] },
  boardDate: { type: String, default: "" },
  lifted: { type: Boolean, default: false }
});

const emit = defineEmits(["booked"]);

const inputRef = ref(null);
const chips = AI_CHIPS;
const hintIndex = ref(0);
const focused = ref(false);
const placeholder = computed(() => AI_PLACEHOLDERS[hintIndex.value]);
const draft = ref("");
const sending = ref(false);
const ui = ref(emptyAgentUi());
const lastMessage = ref("");
const card = computed(() => ui.value.card);
const showShortcutChips = computed(
  () => !sending.value && !ui.value.status && !card.value
);

const bookedSummary = computed(() => {
  const current = card.value;
  if (current?.type !== "booked") return "";
  const title = current.title || defaultBookingTitle(getUserName());
  const slot = current.slot;
  if (!slot) return `${title} 已预定`;
  return `${title} · ${slot.roomName} · ${slot.date} ${slot.start}–${slot.end}`;
});

/** @type {AbortController | null} */
let turnAbort = null;
let turnGen = 0;
/** @type {ReturnType<typeof setInterval> | 0} */
let waitTimer = 0;
let waitIndex = 0;
const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stopWait = () => {
  if (waitTimer) {
    clearInterval(waitTimer);
    waitTimer = 0;
  }
};

/** @type {ReturnType<typeof setTimeout> | 0} */
let emptyIdleTimer = 0;

const stopEmptyIdle = () => {
  if (emptyIdleTimer) {
    clearTimeout(emptyIdleTimer);
    emptyIdleTimer = 0;
  }
};

const scheduleEmptyIdle = () => {
  stopEmptyIdle();
  if (!isEmptySlotNeedMore(ui.value.card)) return;
  emptyIdleTimer = setTimeout(() => {
    emptyIdleTimer = 0;
    if (!isEmptySlotNeedMore(ui.value.card)) return;
    ui.value = idleAfterEmptyResult(ui.value);
  }, EMPTY_SLOT_IDLE_MS);
};

const abortInFlightTurn = () => {
  stopEmptyIdle();
  if (turnAbort) {
    turnAbort.abort();
    turnAbort = null;
  }
};

const startWait = (action) => {
  stopWait();
  waitIndex = 0;
  const hints = waitHintsForAction(action);
  const apply = () => {
    const hint = waitHintAt(hints, waitIndex);
    waitIndex += 1;
    ui.value = {
      ...ui.value,
      open: true,
      status: hint.text,
      expression: hint.expression
    };
  };
  apply();
  if (reduced) return;
  waitTimer = setInterval(apply, 1100);
};

const onEvent = (event, gen) => {
  if (gen !== turnGen) return;
  if (event.type === "debug") return;
  if (
    event.type !== "status" &&
    event.type !== "session" &&
    event.type !== "debug"
  ) {
    stopWait();
  }
  ui.value = applyAgentEvent(ui.value, event);
  trackAgentStreamEvent(ui.value, event);
  if (event.type === "booked") emit("booked");
  scheduleEmptyIdle();
};

const runTurn = async (body) => {
  abortInFlightTurn();
  const gen = ++turnGen;
  const ac = new AbortController();
  turnAbort = ac;
  sending.value = true;
  const action = typeof body.action === "string" ? body.action : "message";
  if (action !== "cancel") startWait(action);
  try {
    await streamTurn(body, (e) => onEvent(e, gen), { signal: ac.signal });
  } catch (err) {
    if (ac.signal.aborted) return;
    stopWait();
    const failEvent = {
      type: "error",
      msg: err.msg || err.message || "请求失败",
      code: err.code,
      expression: "sorry"
    };
    ui.value = applyAgentEvent(ui.value, failEvent);
    trackAgentStreamEvent(ui.value, failEvent);
  } finally {
    stopWait();
    if (turnAbort === ac) turnAbort = null;
    sending.value = false;
  }
};

const sendMessage = (text, meta = {}) => {
  const message = String(text || "").trim();
  if (!message || sending.value) return;
  lastMessage.value = message;
  draft.value = "";
  if (meta.chipId) trackAgentChip(ui.value, meta.chipId);
  else trackAgentMessage(ui.value, message);
  ui.value = {
    ...ui.value,
    open: true,
    card: null,
    backCard: null,
    status: ""
  };
  runTurn({
    ...(ui.value.sessionId ? { sessionId: ui.value.sessionId } : {}),
    action: "message",
    message
  });
};

const onSubmit = () => sendMessage(draft.value);
const sendChip = (chip) => sendMessage(chip.message, { chipId: chip.id });
const retry = () => {
  if (lastMessage.value) sendMessage(lastMessage.value);
};

const pickSlot = (slot) => {
  if (sending.value || !slot) return;
  trackAgentPick(ui.value, slot);
  runTurn({
    ...(ui.value.sessionId ? { sessionId: ui.value.sessionId } : {}),
    action: "pick_slot",
    slot
  });
};

const confirmDraft = (title) => {
  const draftCard = card.value?.type === "confirm" ? card.value.draft : null;
  if (!draftCard || sending.value) return;
  trackAgentConfirm(ui.value);
  runTurn({
    ...(ui.value.sessionId ? { sessionId: ui.value.sessionId } : {}),
    action: "confirm",
    draftId: draftCard.draftId,
    title: String(title || "").slice(0, 50)
  });
};

const goBack = () => {
  abortInFlightTurn();
  trackAgentBack(ui.value);
  ui.value = backFromConfirm(ui.value);
};

const dismiss = () => {
  abortInFlightTurn();
  stopWait();
  stopEmptyIdle();
  const sessionId = ui.value.sessionId;
  ui.value = applyAgentEvent(ui.value, {
    type: "closed",
    expression: "down"
  });
  if (!sessionId) return;
  const gen = ++turnGen;
  const ac = new AbortController();
  turnAbort = ac;
  streamTurn({ sessionId, action: "cancel" }, (e) => onEvent(e, gen), {
    signal: ac.signal
  })
    .catch(() => {})
    .finally(() => {
      if (turnAbort === ac) turnAbort = null;
    });
};

const focusInput = () => {
  inputRef.value?.focus();
};

let hintTimer = 0;
onMounted(() => {
  hintTimer = window.setInterval(() => {
    if (focused.value || draft.value.trim()) return;
    hintIndex.value = nextPlaceholderIndex(hintIndex.value);
  }, AI_PLACEHOLDER_INTERVAL_MS);
});
onBeforeUnmount(() => {
  abortInFlightTurn();
  stopWait();
  stopEmptyIdle();
  turnGen += 1;
  window.clearInterval(hintTimer);
});

defineExpose({ focusInput });
</script>

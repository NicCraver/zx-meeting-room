<template>
  <section
    class="booking-ai-bar"
    data-testid="mr-ai-bar"
    :class="{ 'is-lifted': lifted }"
    aria-label="会议室助手"
  >
    <form class="booking-ai-form" @submit.prevent="onSubmit">
      <textarea
        id="tour-ai-input"
        ref="inputRef"
        data-testid="mr-ai-input"
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
        data-testid="mr-ai-send"
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
        :data-testid="`mr-ai-chip-${chip.id}`"
        :data-tour="chip.id === 'find-free' ? 'chip-find-free' : undefined"
        :disabled="sending"
        role="listitem"
        @click="sendChip(chip)"
      >
        {{ chip.label }}
      </button>
    </div>

    <div
      v-if="ui.status"
      class="booking-ai-status"
      data-testid="mr-ai-status"
      aria-live="polite"
    >
      {{ ui.status }}
    </div>
    <div
      v-else-if="card"
      class="booking-ai-results"
      data-testid="mr-ai-results"
    >
      <button
        type="button"
        class="booking-ai-result-close"
        data-testid="mr-ai-result-close"
        aria-label="关闭"
        @click="dismiss"
      >
        <SvgIcon name="close" class="w-4 h-4" />
      </button>
      <AgentMarkdown
        v-if="card.type === 'need_more'"
        class="ai-buddy-card-copy booking-ai-need-more"
        :source="card.text"
      />
      <div
        v-else-if="card.type === 'error'"
        class="booking-ai-error"
        role="alert"
      >
        <span>{{ card.msg }}</span>
        <AcButton title="重试" @click="retry" />
      </div>
      <el-scrollbar v-else class="booking-ai-results-scroll">
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
          @retarget="retargetSlot"
        />
        <AgentMineCard
          v-else-if="card.type === 'mine'"
          :text="card.text"
          :bookings="card.bookings"
        />
        <AgentReleaseCard
          v-else-if="card.type === 'release_confirm'"
          :booking="card.booking"
          @confirm="confirmRelease"
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
          data-testid="mr-ai-booked"
          aria-label="预定成功"
        >
          <h3 class="ai-buddy-card-title">
            {{ bookedHeading }}
          </h3>
          <p class="ai-buddy-card-copy">{{ bookedSummary }}</p>
          <div class="ai-buddy-card-actions">
            <button type="button" class="ai-buddy-btn-primary" @click="dismiss">
              知道了
            </button>
          </div>
        </article>
      </el-scrollbar>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElScrollbar } from "element-plus";
import { AcButton, SvgIcon } from "@/components/base";
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
import { streamAiMeet } from "@/api/module/aiMeet.js";
import {
  confirmBookingAction,
  confirmReleaseAction
} from "../assistantActions.js";
import { createDraftStore } from "../draftStore.js";
import { runMeetingAgent } from "../runMeetingAgent.js";
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
import AgentMarkdown from "./AgentMarkdown.vue";
import AgentMineCard from "./AgentMineCard.vue";
import AgentQueryCard from "./AgentQueryCard.vue";
import AgentReleaseCard from "./AgentReleaseCard.vue";

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

const bookedHeading = computed(() =>
  String(card.value?.title || "").startsWith("已释放") ? "已释放" : "预定成功"
);

const bookedSummary = computed(() => {
  const current = card.value;
  if (current?.type !== "booked") return "";
  const title = current.title || defaultBookingTitle(getUserName());
  if (String(title).startsWith("已释放")) return title;
  const slot = current.slot;
  if (!slot) return `${title} 已预定`;
  return `${title} · ${slot.roomName} · ${slot.date} ${slot.start}–${slot.end}`;
});

const drafts = createDraftStore();

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

const failTurn = (err, gen) => {
  if (gen !== turnGen) return;
  stopWait();
  const failEvent = {
    type: "error",
    msg: err.msg || err.message || "请求失败",
    code: err.code,
    expression: "sorry"
  };
  onEvent(failEvent, gen);
};

const runMessage = async (message) => {
  abortInFlightTurn();
  const gen = ++turnGen;
  const ac = new AbortController();
  turnAbort = ac;
  sending.value = true;
  startWait("message");
  try {
    const { event, issuedRooms } = await runMeetingAgent({
      prompt: message,
      complete: (payload) => streamAiMeet(payload, { signal: ac.signal }),
      signal: ac.signal
    });
    if (ac.signal.aborted || gen !== turnGen) return;
    if (event.type === "confirm" && event.slot) {
      drafts.issueFromRooms(event.rooms || issuedRooms);
      const draftCard = drafts.pickSlot(event.slot, { title: event.title });
      onEvent({ type: "confirm", draft: draftCard, expression: "expect" }, gen);
      return;
    }
    if (event.type === "query") drafts.issueFromRooms(issuedRooms);
    if (event.type === "release_confirm") drafts.setRelease(event.booking);
    onEvent(event, gen);
  } catch (err) {
    if (ac.signal.aborted || err?.name === "AbortError") return;
    failTurn(err, gen);
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
  runMessage(message);
};

const onSubmit = () => sendMessage(draft.value);
const sendChip = (chip) => sendMessage(chip.message, { chipId: chip.id });
const retry = () => {
  if (lastMessage.value) sendMessage(lastMessage.value);
};

const pickSlot = (slot) => {
  if (sending.value || !slot) return;
  trackAgentPick(ui.value, slot);
  try {
    const draftCard = drafts.pickSlot(slot);
    onEvent(
      { type: "confirm", draft: draftCard, expression: "expect" },
      turnGen
    );
  } catch (err) {
    failTurn(err, turnGen);
  }
};

const retargetSlot = (patch) => {
  if (sending.value || card.value?.type !== "confirm") return;
  try {
    const next = drafts.updateSlot(patch);
    ui.value = {
      ...ui.value,
      card: { ...card.value, draft: next }
    };
  } catch (err) {
    failTurn(err, turnGen);
  }
};

const confirmDraft = async (title) => {
  const draftCard = card.value?.type === "confirm" ? card.value.draft : null;
  if (!draftCard || sending.value) return;
  trackAgentConfirm(ui.value);
  abortInFlightTurn();
  const gen = ++turnGen;
  sending.value = true;
  startWait("confirm");
  try {
    drafts.confirmPayload(title);
    const latest = drafts.peek().draft || draftCard;
    const event = await confirmBookingAction(latest, title, {
      userName: getUserName()
    });
    if (event.type === "suggest") {
      drafts.issueFromRooms([{ slots: event.options }]);
    } else {
      drafts.clear();
    }
    onEvent(event, gen);
  } catch (err) {
    failTurn(err, gen);
  } finally {
    stopWait();
    sending.value = false;
  }
};

const confirmRelease = async () => {
  const booking =
    card.value?.type === "release_confirm" ? card.value.booking : null;
  if (!booking || sending.value) return;
  abortInFlightTurn();
  const gen = ++turnGen;
  sending.value = true;
  startWait("confirm");
  try {
    const event = await confirmReleaseAction(booking);
    drafts.clear();
    onEvent(event, gen);
  } catch (err) {
    failTurn(err, gen);
  } finally {
    stopWait();
    sending.value = false;
  }
};

const goBack = () => {
  abortInFlightTurn();
  trackAgentBack(ui.value);
  drafts.clear();
  ui.value = backFromConfirm(ui.value);
};

const dismiss = () => {
  abortInFlightTurn();
  stopWait();
  stopEmptyIdle();
  drafts.clear();
  ui.value = applyAgentEvent(ui.value, {
    type: "closed",
    expression: "down"
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

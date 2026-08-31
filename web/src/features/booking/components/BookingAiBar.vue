<template>
  <section class="booking-ai-bar" aria-label="会议室助手">
    <form class="booking-ai-form" @submit.prevent="onSubmit">
      <input
        id="tour-ai-input"
        data-tour="ai-input"
        v-model="draft"
        type="text"
        maxlength="200"
        class="booking-ai-input"
        :placeholder="placeholder"
        :disabled="loading"
        aria-label="对助手说"
      />
      <AcButton
        type="primary"
        :title="loading ? '查找中…' : '发送'"
        :loading="loading"
        :disabled="loading"
        @click="onSubmit"
      />
    </form>
    <div class="booking-ai-chips" role="list" aria-label="快捷指令">
      <button
        v-for="chip in chips"
        :key="chip.id"
        type="button"
        class="booking-ai-chip"
        :data-tour="chip.id === 'find-free' ? 'chip-find-free' : undefined"
        :disabled="loading"
        role="listitem"
        @click="sendChip(chip)"
      >
        {{ chip.label }}
      </button>
    </div>

    <div v-if="loading" class="booking-ai-status" aria-live="polite">
      正在查找…
    </div>
    <div v-else-if="errorText" class="booking-ai-status" role="alert">
      <span>{{ errorText }}</span>
      <AcButton title="重试" @click="retry" />
    </div>
    <div v-else-if="ask" class="booking-ai-ask">
      <p>{{ ask.text }}</p>
      <div class="booking-ai-chips">
        <button
          v-for="opt in ask.options"
          :key="opt.label"
          type="button"
          class="booking-ai-chip"
          @click="applyAsk(opt)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <p v-else-if="emptyAdvice" class="booking-ai-status">{{ emptyAdvice }}</p>
    <p v-else-if="infoText" class="booking-ai-status">{{ infoText }}</p>
    <AgentQueryCard
      v-if="resultRooms.length"
      :heading="heading"
      :rooms="resultRooms"
      @pick="onBookSlot"
      @book="onBookSlot"
    />
  </section>
</template>

<script setup>
import { ref } from "vue";
import { getBoard } from "@/server/module/booking";
import { listMyBookings } from "@/server/module/booking";
import { AcButton } from "@/components/base";
import { AI_CHIPS, AI_PLACEHOLDER } from "../aiChips.js";
import {
  fallbackAdvice,
  nextMissingFindFreeField,
  parseFindFreeQuery,
  searchFreeSlots,
  slotToBookingDraft
} from "../findFree.js";
import { shanghaiToday } from "../time.js";
import AgentQueryCard from "./AgentQueryCard.vue";

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  boardDate: { type: String, default: "" }
});

const emit = defineEmits(["book", "openMine"]);

const chips = AI_CHIPS;
const placeholder = AI_PLACEHOLDER;
const draft = ref("");
const loading = ref(false);
const errorText = ref("");
const emptyAdvice = ref("");
const infoText = ref("");
const heading = ref("");
const resultRooms = ref([]);
const ask = ref(null);
const queryState = ref(null);
const lastAction = ref(null);

const nowMin = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const n = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  return n("hour") * 60 + n("minute");
};

const resetResults = () => {
  errorText.value = "";
  emptyAdvice.value = "";
  infoText.value = "";
  resultRooms.value = [];
  ask.value = null;
  heading.value = "";
};

const roomsForDate = async (dateIso) => {
  if (dateIso === props.boardDate) return props.rooms;
  const data = await getBoard(dateIso);
  return data?.rooms || [];
};

const runFindFree = async (query) => {
  const todayIso = shanghaiToday();
  const missing = nextMissingFindFreeField(query, { todayIso });
  if (missing) {
    queryState.value = query;
    ask.value = missing;
    return;
  }
  const list = await roomsForDate(query.dateIso);
  const now = { date: todayIso, minute: nowMin() };
  const found = searchFreeSlots(list, query, now);
  if (!found.rooms.length) {
    emptyAdvice.value = fallbackAdvice(list, query, now);
    return;
  }
  heading.value = found.heading;
  resultRooms.value = found.rooms;
};

const sendText = async (text) => {
  const message = String(text || "").trim();
  if (!message) return;
  lastAction.value = { type: "text", message };
  resetResults();
  loading.value = true;
  try {
    if (/今天有哪些会|我的会/.test(message)) {
      const mine = await listMyBookings();
      const items = Array.isArray(mine) ? mine : mine?.list || [];
      infoText.value = items.length
        ? `今天有 ${items.length} 场：${items
            .slice(0, 3)
            .map((b) => b.title || "会议")
            .join("、")}`
        : "今天还没有预定";
      return;
    }
    if (/取消/.test(message)) {
      infoText.value = "打开「我的预定」可以释放最近一场会";
      emit("openMine");
      return;
    }
    const todayIso = shanghaiToday();
    const query = parseFindFreeQuery(message, { todayIso, nowMin: nowMin() });
    queryState.value = query;
    await runFindFree(query);
  } catch (err) {
    errorText.value = err.msg || err.message || "查找失败，请重试";
  } finally {
    loading.value = false;
  }
};

const onSubmit = () => sendText(draft.value);
const sendChip = (chip) => {
  draft.value = chip.message;
  sendText(chip.message);
};
const retry = () => {
  if (lastAction.value?.message) sendText(lastAction.value.message);
};
const applyAsk = async (opt) => {
  const next = { ...queryState.value, ...opt.patch };
  queryState.value = next;
  resetResults();
  loading.value = true;
  try {
    await runFindFree(next);
  } catch (err) {
    errorText.value = err.msg || err.message || "查找失败，请重试";
  } finally {
    loading.value = false;
  }
};

const onBookSlot = (slot) => {
  emit("book", slotToBookingDraft(slot, props.rooms));
};
</script>

<template>
  <div class="zx-page min-h-100vh bg-layout-gradient px-16px py-24px">
    <div class="mx-auto max-w-1100px">
      <div class="flex items-start justify-between gap-16px">
        <div>
          <h1 class="m-0 text-22px font-600 leading-32px">并发抢订测试</h1>
          <p class="m-0 mt-8px text-14px leading-22px text-grayDark">
            两个网页同时订同一会议室同一时段。行锁串行化「查冲突 →
            落库」，冲突查询必须读到已提交数据，期望一人成功、另一人 M4010。
          </p>
        </div>
        <a
          class="shrink-0 text-14px leading-22px text-primary"
          :href="homeHref"
        >
          回预定看板
        </a>
      </div>

      <p v-if="loadError" class="mt-16px text-14px text-danger">
        {{ loadError }}
      </p>

      <div
        v-else
        class="mt-16px rounded-8px border border-edge bg-canvas px-16px py-12px text-14px leading-22px"
      >
        <p class="m-0">
          目标：{{
            slot
              ? `${slot.roomName} ${slot.dateIso} ${slot.startHm}-${slot.endHm}`
              : "正在找空档…"
          }}
        </p>
        <p class="m-0 mt-4px text-12px text-mute">
          身份 {{ meName || "…" }} · 网页就绪 {{ readyCount }}/2
        </p>
        <p v-if="verdict" class="m-0 mt-8px font-500" :class="verdictClass">
          {{ verdict.label }}
        </p>
      </div>

      <div class="mt-12px flex flex-wrap gap-8px">
        <button
          type="button"
          class="px-12px py-8px rounded-8px bg-primary text-onPrimary text-14px leading-20px disabled:opacity-50"
          :disabled="!canFire"
          @click="fire"
        >
          同时预定
        </button>
        <button
          type="button"
          class="px-12px py-8px rounded-8px border border-edge bg-canvas text-14px leading-20px"
          @click="reloadSlot"
        >
          换一个空档
        </button>
        <button
          type="button"
          class="px-12px py-8px rounded-8px border border-edge bg-canvas text-14px leading-20px"
          @click="openWindows"
        >
          改用两个独立窗口
        </button>
        <button
          type="button"
          class="px-12px py-8px rounded-8px border border-edge bg-canvas text-14px leading-20px disabled:opacity-50"
          :disabled="!winnerIds.length"
          @click="releaseWinners"
        >
          释放刚订上的
        </button>
      </div>

      <div class="mt-16px grid gap-12px md:grid-cols-2">
        <iframe
          v-for="side in sides"
          v-show="showIframes"
          :key="side"
          :src="showIframes ? paneSrc(side) : 'about:blank'"
          :title="`抢订网页 ${side}`"
          class="h-320px w-full rounded-8px border border-edge bg-canvas"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { getBoard, releaseBooking } from "@/api/module/booking";
import { getMe } from "@/api/module/me";
import { addDays, shanghaiToday } from "@/features/booking/time";
import { pickFirstFreeSlot } from "./pickRaceSlot";
import { classifyRacePair, RACE_CHANNEL } from "./raceProtocol";

const sides = ["A", "B"];
const meName = ref("");
const loadError = ref("");
const slot = ref(null);
const ready = ref({ A: false, B: false });
const results = ref({});
const firing = ref(false);
const showIframes = ref(true);
const homeHref = `${import.meta.env.BASE_URL}${location.search}`;
let channel;

const readyCount = computed(
  () => Number(ready.value.A) + Number(ready.value.B)
);
const verdict = computed(() => classifyRacePair(results.value));
const verdictClass = computed(() => {
  if (verdict.value.verdict === "serialized") return "text-success";
  if (verdict.value.verdict === "overlap") return "text-danger";
  return "text-body";
});
const canFire = computed(
  () => Boolean(slot.value) && readyCount.value === 2 && !firing.value
);
const winnerIds = computed(() =>
  sides
    .map((s) => results.value[s])
    .filter((r) => r?.ok && r.id)
    .map((r) => r.id)
);

const paneSrc = (side) => {
  const q = new URLSearchParams(location.search);
  q.set("side", side);
  return `${import.meta.env.BASE_URL}race-pane?${q.toString()}`;
};

const payloadOf = (s) => ({
  roomId: s.roomId,
  roomName: s.roomName,
  date: s.dateIso,
  start: s.startHm,
  end: s.endHm
});

const armPanes = () => {
  if (!slot.value) return;
  results.value = {};
  channel.postMessage({ type: "arm", payload: payloadOf(slot.value) });
};

const reloadSlot = async () => {
  loadError.value = "";
  try {
    const today = shanghaiToday();
    const dateIso = addDays(today, 1);
    const board = await getBoard(dateIso);
    const picked = pickFirstFreeSlot(board?.rooms || [], {
      dateIso,
      todayIso: today
    });
    if (!picked) {
      slot.value = null;
      loadError.value = "明天没有 30 分钟空档，换一天或先释放占用。";
      return;
    }
    slot.value = picked;
    armPanes();
  } catch (error) {
    loadError.value = error.msg || error.message || "拉看板失败";
  }
};

const fire = () => {
  if (!canFire.value) return;
  firing.value = true;
  results.value = {};
  channel.postMessage({ type: "fire" });
};

const openWindows = () => {
  showIframes.value = false;
  ready.value = { A: false, B: false };
  results.value = {};
  for (const side of sides) {
    window.open(paneSrc(side), `race-${side}`, "width=420,height=640");
  }
};

const releaseWinners = async () => {
  for (const id of winnerIds.value) {
    try {
      await releaseBooking(id);
    } catch {
      /* 已释放也无所谓 */
    }
  }
  results.value = {};
  await reloadSlot();
};

const onMessage = (ev) => {
  const msg = ev.data || {};
  if (msg.type === "hello" && sides.includes(msg.side)) {
    ready.value = { ...ready.value, [msg.side]: true };
    if (slot.value) armPanes();
    return;
  }
  if (msg.type === "armed" && sides.includes(msg.side)) {
    ready.value = { ...ready.value, [msg.side]: true };
    return;
  }
  if (msg.type === "result" && sides.includes(msg.side)) {
    results.value = { ...results.value, [msg.side]: msg };
    if (results.value.A && results.value.B) firing.value = false;
  }
};

onMounted(async () => {
  channel = new BroadcastChannel(RACE_CHANNEL);
  channel.addEventListener("message", onMessage);
  try {
    const me = await getMe();
    meName.value = me?.userName || "";
  } catch {
    meName.value = "";
  }
  await reloadSlot();
});

onUnmounted(() => {
  channel?.close();
});
</script>

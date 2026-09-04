<template>
  <div class="h-full min-h-240px flex flex-col bg-canvas px-16px py-16px">
    <p class="m-0 text-12px leading-18px text-mute">网页 {{ side }}</p>
    <h2 class="m-0 mt-4px text-16px font-600 leading-24px">
      {{ firing ? "正在提交…" : armed ? "已瞄准，等发令" : "待命" }}
    </h2>
    <p class="m-0 mt-8px text-13px leading-20px text-body">
      {{ slotLabel }}
    </p>
    <pre
      class="mt-12px mb-0 flex-1 overflow-auto rounded-8px bg-grayLight p-12px text-12px leading-18px text-ink whitespace-pre-wrap"
      >{{ log }}</pre>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { createBooking } from "@/api/module/booking";
import { RACE_CHANNEL } from "./raceProtocol";

const side = new URLSearchParams(location.search).get("side") || "A";
const armed = ref(false);
const firing = ref(false);
const log = ref("等控制页发令。");
const payload = ref(null);
let channel;

const slotLabel = computed(() => {
  const p = payload.value;
  if (!p) return "还没有目标时段";
  return `${p.roomName} · ${p.date} ${p.start}-${p.end}`;
});

const write = (line) => {
  log.value = line;
};

const onMessage = async (ev) => {
  const msg = ev.data || {};
  if (msg.type === "arm" && msg.payload) {
    payload.value = msg.payload;
    armed.value = true;
    firing.value = false;
    write(
      `瞄准 ${msg.payload.roomName} ${msg.payload.date} ${msg.payload.start}-${msg.payload.end}`
    );
    channel.postMessage({ type: "armed", side });
    return;
  }
  if (msg.type !== "fire" || !payload.value || firing.value) return;
  firing.value = true;
  armed.value = false;
  const started = performance.now();
  const body = payload.value;
  write("已发 POST /bookings/create");
  try {
    const data = await createBooking({
      roomId: body.roomId,
      date: body.date,
      start: body.start,
      end: body.end,
      title: `抢订测试-${side}`
    });
    const result = {
      type: "result",
      side,
      ok: true,
      code: "M0000",
      id: data?.id,
      msg: "预定成功",
      elapsed: Math.round(performance.now() - started)
    };
    write(`成功 ${result.code} id=${result.id} ${result.elapsed}ms`);
    channel.postMessage(result);
  } catch (error) {
    const result = {
      type: "result",
      side,
      ok: false,
      code: error.code || "ERR",
      id: null,
      msg: error.msg || error.message || "预定失败",
      elapsed: Math.round(performance.now() - started)
    };
    write(`失败 ${result.code} ${result.msg} ${result.elapsed}ms`);
    channel.postMessage(result);
  } finally {
    firing.value = false;
  }
};

onMounted(() => {
  channel = new BroadcastChannel(RACE_CHANNEL);
  channel.addEventListener("message", onMessage);
  channel.postMessage({ type: "hello", side });
});

onUnmounted(() => {
  channel?.close();
});
</script>

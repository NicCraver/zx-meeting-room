<template>
  <article
    class="ai-buddy-card ai-buddy-confirm"
    data-testid="mr-ai-confirm"
    aria-label="确认预定"
  >
    <h3 class="ai-buddy-card-title">确认预定</h3>
    <label class="ai-buddy-confirm-field">
      <span>主题</span>
      <input
        v-model="title"
        type="text"
        maxlength="50"
        :placeholder="titlePlaceholder"
        aria-label="会议主题"
      />
    </label>
    <dl class="ai-buddy-confirm-kv">
      <div>
        <dt>会议室</dt>
        <dd>{{ slot.roomName }}</dd>
      </div>
      <div>
        <dt>地点</dt>
        <dd>{{ slot.buildingName }} {{ slot.floorName }}</dd>
      </div>
    </dl>
    <label class="ai-buddy-confirm-field">
      <span>时间</span>
      <DateTimeRangeField
        v-model:date-iso="dateIso"
        v-model:start="startMin"
        v-model:end="endMin"
      />
    </label>
    <div class="ai-buddy-card-actions">
      <button type="button" class="ai-buddy-btn-ghost" @click="emit('cancel')">
        返回
      </button>
      <button
        type="button"
        class="ai-buddy-btn-primary"
        data-testid="mr-ai-confirm-ok"
        @click="emit('confirm', title.trim())"
      >
        确认预定
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { defaultBookingTitle } from "@/features/booking/defaultTitle";
import DateTimeRangeField from "@/features/booking/components/DateTimeRangeField.vue";
import { fromMinutes, toMinutes } from "@/features/booking/time";
import { getUserName } from "@/utils";

const props = defineProps({
  draft: { type: Object, required: true }
});

const emit = defineEmits(["confirm", "cancel", "retarget"]);

const titlePlaceholder = defaultBookingTitle(getUserName());

const titleFromDraft = (raw) => {
  const text = String(raw || "").trim();
  if (!text) return titlePlaceholder;
  if (
    /找空闲|有哪些会|取消我最近|帮我订明天上午/.test(text) &&
    text.length <= 20
  ) {
    return titlePlaceholder;
  }
  return text;
};

const slot = computed(() => props.draft?.slot || {});
const title = ref(titleFromDraft(props.draft?.title));
const dateIso = ref(String(slot.value.date || ""));
const startMin = ref(toMinutes(slot.value.start || "00:00"));
const endMin = ref(toMinutes(slot.value.end || "00:30"));

watch(
  () => [props.draft?.draftId, props.draft?.title],
  () => {
    title.value = titleFromDraft(props.draft?.title);
  }
);

watch(
  () => props.draft?.draftId,
  () => {
    dateIso.value = String(slot.value.date || "");
    startMin.value = toMinutes(slot.value.start || "00:00");
    endMin.value = toMinutes(slot.value.end || "00:30");
  }
);

watch([dateIso, startMin, endMin], () => {
  const next = {
    date: dateIso.value,
    start: fromMinutes(startMin.value),
    end: fromMinutes(endMin.value)
  };
  if (
    next.date === slot.value.date &&
    next.start === slot.value.start &&
    next.end === slot.value.end
  ) {
    return;
  }
  emit("retarget", next);
});
</script>

<template>
  <DialogOrSheet
    :sheet="fullScreen"
    title="预约会议室"
    :no-btn="fullScreen"
    :prevent-mask-close="submitting"
    :btn-loading="submitting"
    :submit-disabled="!canSubmit"
    submit-title="提交预定"
    width="480px"
    @submit="handleSubmit"
    @close="emit('close')"
  >
    <form class="create-schedule-form" @submit.prevent="handleSubmit">
      <div v-if="fullScreen" class="sheet-header">
        <button
          type="button"
          class="navbar-action"
          style="color: var(--color-body)"
          :disabled="submitting"
          @click="emit('close')"
        >
          取消
        </button>
        <span class="sheet-title">预约会议室</span>
        <button
          type="submit"
          class="navbar-action"
          style="font-weight: 500"
          :disabled="!canSubmit"
        >
          {{ submitting ? "提交中…" : "完成" }}
        </button>
      </div>

      <div class="sheet-body">
        <div class="form-group-card">
          <div class="form-cell">
            <input
              v-model="title"
              type="text"
              name="title"
              autocomplete="off"
              class="form-input-text"
              maxlength="50"
              aria-label="会议主题"
              :placeholder="titlePlaceholder"
              style="font-size: 16px; font-weight: 500"
            />
          </div>
        </div>

        <div class="form-group-card">
          <label class="form-cell">
            <span class="form-cell-label">会议室</span>
            <select
              v-model="roomId"
              class="form-input-text"
              aria-label="会议室"
            >
              <option
                v-for="r in roomOptions"
                :key="r.id"
                :value="r.id"
              >
                {{ r.name }}（{{ r.buildingName }} {{ r.floorName }}）
              </option>
            </select>
          </label>
          <label class="form-cell">
            <span class="form-cell-label">日期</span>
            <input
              v-model="dateIso"
              type="date"
              class="form-input-text"
              aria-label="日期"
            />
          </label>
          <label class="form-cell">
            <span class="form-cell-label">开始时间</span>
            <select v-model.number="startMin" class="form-input-text" aria-label="开始时间">
              <option v-for="t in timeOptions" :key="`s-${t}`" :value="t">
                {{ fromMinutes(t) }}
              </option>
            </select>
          </label>
          <label class="form-cell">
            <span class="form-cell-label">结束时间</span>
            <select v-model.number="endMin" class="form-input-text" aria-label="结束时间">
              <option v-for="t in endOptions" :key="`e-${t}`" :value="t">
                {{ fromMinutes(t) }}
              </option>
            </select>
          </label>
          <div class="form-cell">
            <span class="form-cell-label">预定人</span>
            <span class="form-cell-value">{{ hostName }}</span>
          </div>
        </div>

        <div class="form-group-card">
          <label class="form-cell">
            <span class="form-cell-label">参会人（可选）</span>
            <input
              v-model="attendees"
              type="text"
              class="form-input-text"
              maxlength="80"
              aria-label="参会人"
              placeholder="选填，如：王五、赵六"
              style="text-align: right"
            />
          </label>
          <div class="form-cell">
            <span class="form-cell-label">会议提醒</span>
            <span class="form-cell-value">开始前 15 分钟</span>
          </div>
          <div class="form-cell">
            <span class="form-cell-label">会议说明</span>
            <input
              v-model="remark"
              type="text"
              name="remark"
              autocomplete="off"
              class="form-input-text"
              maxlength="100"
              aria-label="会议说明"
              placeholder="例如：对齐议程…"
              style="text-align: right"
            />
          </div>
          <label
            v-if="selectedRoom?.allowRecurring && bookingDates.length < 2"
            class="form-cell"
          >
            <span class="form-cell-label">每周重复</span>
            <input
              v-model="repeatWeekly"
              type="checkbox"
              name="repeatWeekly"
            />
          </label>
        </div>
        <p
          v-if="conflictText"
          class="form-inline-error"
          role="alert"
          aria-live="polite"
        >
          {{ conflictText }}
        </p>
        <p v-else-if="formError" class="form-inline-error" aria-live="polite">
          {{ formError }}
        </p>
      </div>

      <div v-if="fullScreen" class="sheet-footer">
        <AcButton
          class="h-11 w-full"
          type="primary"
          :title="submitting ? '提交中…' : '提交预定'"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </form>
  </DialogOrSheet>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { createBooking, getBoard } from "@/server/module/booking";
import { createdCount } from "../mine";
import { fromMinutes, TL } from "../time";
import { defaultBookingTitle } from "../defaultTitle";
import {
  canSubmitBooking,
  conflictMessage,
  findSlotOccupant
} from "../bookingConflict";
import { getUserId, getUserName, showToastError } from "@/utils";
import { AcButton } from "@/components/base";
import DialogOrSheet from "./DialogOrSheet.vue";

const props = defineProps({
  room: { type: Object, required: true },
  rooms: { type: Array, default: () => [] },
  rangeText: { type: String, default: "" },
  dateLabel: { type: String, default: "" },
  dateIso: { type: String, required: true },
  dates: { type: Array, default: () => [] },
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  fullScreen: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "success"]);

const title = ref("");
const remark = ref("");
const attendees = ref("");
const repeatWeekly = ref(false);
const submitting = ref(false);
const formError = ref("");
const conflictText = ref("");
const extraBusy = ref(null);
const hostName = getUserName() || "";
const titlePlaceholder = defaultBookingTitle(hostName);

const roomId = ref(props.room.id);
const dateIso = ref(props.dateIso);
const startMin = ref(props.start);
const endMin = ref(props.end);

const roomOptions = computed(() => {
  const list = props.rooms?.length ? props.rooms : [props.room];
  if (!list.some((r) => r.id === props.room.id)) {
    return [props.room, ...list];
  }
  return list;
});

const selectedRoom = computed(
  () => roomOptions.value.find((r) => r.id === roomId.value) || props.room
);

const timeOptions = computed(() => {
  const out = [];
  for (let m = 0; m < TL.DAY_MIN; m += TL.SNAP) out.push(m);
  return out;
});

const endOptions = computed(() =>
  timeOptions.value.filter((t) => t > startMin.value).concat([TL.DAY_MIN])
);

const bookingDates = computed(() =>
  props.dates?.length && dateIso.value === props.dateIso
    ? props.dates
    : [dateIso.value]
);

const busyForConflict = computed(() => {
  if (extraBusy.value) return extraBusy.value;
  const room = selectedRoom.value;
  if (!room) return [];
  if (room.weekDays?.length) {
    const day = room.weekDays.find((d) => d.date === dateIso.value);
    return day?.busyEvents || [];
  }
  return room.busyEvents || [];
});

const refreshConflict = () => {
  const occ = findSlotOccupant(
    busyForConflict.value,
    startMin.value,
    endMin.value
  );
  conflictText.value = conflictMessage(occ);
};

watch(
  () => [roomId.value, dateIso.value, startMin.value, endMin.value],
  refreshConflict,
  { immediate: true }
);

watch(dateIso, async (next) => {
  extraBusy.value = null;
  const room = selectedRoom.value;
  if (!room) return;
  const onBoard =
    next === props.dateIso &&
    (room.busyEvents || room.weekDays?.some((d) => d.date === next));
  if (onBoard) {
    refreshConflict();
    return;
  }
  try {
    const data = await getBoard(next);
    const match = (data?.rooms || []).find((r) => r.id === roomId.value);
    extraBusy.value = match?.busyEvents || [];
  } catch {
    extraBusy.value = [];
  }
  refreshConflict();
});

const canSubmit = computed(() =>
  canSubmitBooking({
    room: selectedRoom.value,
    start: startMin.value,
    end: endMin.value,
    conflictText: conflictText.value,
    submitting: submitting.value
  })
);

const handleSubmit = async () => {
  if (!canSubmit.value) return;
  formError.value = "";
  if (!getUserId()) {
    formError.value = "缺少用户信息，请重新登录";
    return;
  }
  submitting.value = true;
  try {
    const trimmed = title.value.trim();
    const dates = bookingDates.value;
    const people = attendees.value.trim();
    const note = [remark.value.trim(), people ? `参会人：${people}` : ""]
      .filter(Boolean)
      .join("；");
    const result = await createBooking({
      roomId: selectedRoom.value.id,
      date: dates[0],
      dates: dates.length > 1 ? dates : undefined,
      start: fromMinutes(startMin.value),
      end: fromMinutes(endMin.value),
      title: trimmed || defaultBookingTitle(hostName),
      remark: note,
      repeatWeekly: Boolean(
        selectedRoom.value.allowRecurring &&
          repeatWeekly.value &&
          dates.length < 2
      )
    });
    emit("success", createdCount(result));
  } catch (error) {
    formError.value =
      error.msg || error.message || "预定失败，请检查时段后重试";
    showToastError(formError.value);
  } finally {
    submitting.value = false;
  }
};
</script>

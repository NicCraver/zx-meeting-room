<template>
  <DialogOrSheet
    :sheet="fullScreen"
    :title="editing ? '修改预定' : '预约会议室'"
    :no-btn="fullScreen"
    :prevent-mask-close="submitting"
    :btn-loading="submitting"
    :submit-disabled="!canSubmit"
    :submit-title="editing ? '保存修改' : '提交预定'"
    width="400px"
    class="create-schedule-dialog"
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
        <span class="sheet-title">{{
          editing ? "修改预定" : "预约会议室"
        }}</span>
        <button
          type="submit"
          class="navbar-action"
          style="font-weight: 500"
          :disabled="!canSubmit"
        >
          {{ submitting ? "提交中…" : "完成" }}
        </button>
      </div>

      <div class="sheet-body" :class="{ 'is-pc-dialog': !fullScreen }">
        <div class="form-group-card">
          <div class="form-cell">
            <input
              v-model="title"
              type="text"
              name="title"
              autocomplete="off"
              class="form-input-text form-input-title"
              maxlength="50"
              aria-label="会议主题"
              :placeholder="titlePlaceholder"
            />
          </div>
        </div>

        <div class="form-group-card">
          <label class="form-cell">
            <span class="form-cell-label">会议室</span>
            <select
              v-model="roomId"
              class="form-select"
              aria-label="会议室"
              :disabled="Boolean(editing)"
            >
              <option v-for="r in roomOptions" :key="r.id" :value="r.id">
                {{ r.name }}（{{ r.buildingName }} {{ r.floorName }}）
              </option>
            </select>
          </label>
          <div class="form-cell">
            <span class="form-cell-label">预定时段</span>
            <div class="form-cell-value">
              <DateTimeRangeField
                v-model:date-iso="dateIso"
                v-model:start="startMin"
                v-model:end="endMin"
              />
            </div>
          </div>
          <div class="form-cell">
            <span class="form-cell-label">预定人</span>
            <span class="form-cell-value">{{ hostName }}</span>
          </div>
        </div>

        <div class="form-group-card">
          <label class="form-cell">
            <span class="form-cell-label">参会人</span>
            <input
              v-model="attendees"
              type="text"
              class="form-input-text form-input-end"
              maxlength="80"
              aria-label="参会人"
              placeholder="选填，如：王五、赵六"
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
              class="form-input-text form-input-end"
              maxlength="100"
              aria-label="会议说明"
              placeholder="添加会议议程或备注"
            />
          </div>
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
          :title="
            submitting ? '提交中…' : editing ? '保存修改' : '提交预定'
          "
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </form>
  </DialogOrSheet>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { track } from "../telemetry";
import { createBooking, getBoard, updateBooking } from "@/api/module/booking";
import { createdCount } from "../mine";
import { fromMinutes } from "../time";
import DateTimeRangeField from "./DateTimeRangeField.vue";
import { defaultBookingTitle } from "../defaultTitle";
import {
  canSubmitBooking,
  conflictMessage,
  findSlotOccupant,
  occupancySource
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
  boardDate: { type: String, default: "" },
  fullScreen: { type: Boolean, default: false },
  editing: { type: Object, default: null }
});

const emit = defineEmits(["close", "success"]);

const hostName = getUserName() || "";
const titlePlaceholder = defaultBookingTitle(hostName);
const title = ref(props.editing?.title || titlePlaceholder);
const remark = ref(String(props.editing?.remark || ""));
const attendees = ref("");
const submitting = ref(false);
const formError = ref("");
const conflictText = ref("");
const extraBusy = ref(null);
const occupancyLoading = ref(false);

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

const bookingDates = computed(() =>
  props.dates?.length && dateIso.value === props.dateIso
    ? props.dates
    : [dateIso.value]
);

const occupancy = computed(() =>
  occupancySource({
    bookingDateIso: dateIso.value,
    boardDateIso: props.boardDate,
    room: selectedRoom.value,
    fetchedBusy: extraBusy.value
  })
);

const refreshConflict = () => {
  if (occupancy.value.fetch) {
    conflictText.value = "";
    return;
  }
  const occ = findSlotOccupant(
    occupancy.value.events,
    startMin.value,
    endMin.value,
    props.editing?.id
  );
  conflictText.value = conflictMessage(occ);
};

watch(
  () => [roomId.value, dateIso.value, startMin.value, endMin.value],
  refreshConflict,
  { immediate: true }
);

watch(
  () => [roomId.value, dateIso.value],
  async () => {
    extraBusy.value = null;
    const src = occupancySource({
      bookingDateIso: dateIso.value,
      boardDateIso: props.boardDate,
      room: selectedRoom.value,
      fetchedBusy: null
    });
    if (!src.fetch) {
      refreshConflict();
      return;
    }
    occupancyLoading.value = true;
    conflictText.value = "";
    try {
      const data = await getBoard(dateIso.value);
      const match = (data?.rooms || []).find((r) => r.id === roomId.value);
      extraBusy.value = match?.busyEvents || [];
    } catch {
      extraBusy.value = [];
    } finally {
      occupancyLoading.value = false;
      refreshConflict();
    }
  },
  { immediate: true }
);

const canSubmit = computed(() =>
  canSubmitBooking({
    room: selectedRoom.value,
    start: startMin.value,
    end: endMin.value,
    conflictText: conflictText.value,
    submitting: submitting.value,
    occupancyLoading: occupancyLoading.value
  })
);

onMounted(() => {
  track("booking_open", { roomId: props.room?.id });
});

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
    const payload = {
      roomId: selectedRoom.value.id,
      date: dates[0],
      dates: dates.length > 1 ? dates : undefined,
      start: fromMinutes(startMin.value),
      end: fromMinutes(endMin.value),
      title: trimmed || defaultBookingTitle(hostName),
      remark: note
    };
    if (props.editing?.id) {
      await updateBooking(props.editing.id, {
        date: payload.date,
        start: payload.start,
        end: payload.end,
        title: payload.title,
        remark: payload.remark
      });
      track("booking_submit", {
        source: "edit",
        roomId: selectedRoom.value.id,
        dateCount: 1
      });
      emit("success", 1);
    } else {
      const result = await createBooking(payload);
      track("booking_submit", {
        source: "form",
        roomId: selectedRoom.value.id,
        dateCount: dates.length
      });
      emit("success", createdCount(result));
    }
  } catch (error) {
    formError.value =
      error.msg ||
      error.message ||
      (props.editing ? "修改失败，请检查时段后重试" : "预定失败，请检查时段后重试");
    track("booking_fail", {
      source: "form",
      code: error.code ? String(error.code).slice(0, 32) : undefined
    });
    showToastError(formError.value);
  } finally {
    submitting.value = false;
  }
};
</script>

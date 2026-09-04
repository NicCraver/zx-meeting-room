<template>
  <DialogOrSheet
    :sheet="mobileEnv"
    title="我的预定"
    no-btn
    close-on-click-modal
    width="520px"
    class="mine-bookings-dialog"
    @close="emit('close')"
  >
    <div class="bookings-dialog">
      <div v-if="mobileEnv" class="sheet-header">
        <span id="bookings-dialog-title" class="sheet-title">我的预定</span>
        <button type="button" class="navbar-action" @click="emit('close')">
          关闭
        </button>
      </div>
      <div class="sheet-body bookings-dialog-body">
        <div v-if="loading" class="bookings-loading" role="status">
          <span class="i-carbon-circle-dash animate-spin" aria-hidden="true" />
          加载中…
        </div>
        <AcEmpty v-else-if="!bookings.length" title="暂无预定">
          <template #desc>
            <span class="text-caption text-mute">{{ emptyHint }}</span>
          </template>
        </AcEmpty>
        <template v-else>
          <div class="mine-scope-tabs" role="tablist" aria-label="预定分类">
            <button
              type="button"
              class="mine-scope-tab"
              role="tab"
              :aria-selected="tab === 'live'"
              :class="{ active: tab === 'live' }"
              @click="tab = 'live'"
            >
              可操作 {{ live.length }}
            </button>
            <button
              type="button"
              class="mine-scope-tab"
              role="tab"
              :aria-selected="tab === 'past'"
              :class="{ active: tab === 'past' }"
              @click="tab = 'past'"
            >
              历史 {{ past.length }}
            </button>
          </div>
          <AcEmpty v-if="!visible.length" :title="tabEmptyTitle" />
          <ul v-else class="mine-booking-list">
            <li
              v-for="b in visible"
              :key="b.id"
              class="mine-booking-card"
              @click="emit('locate', b)"
            >
              <div class="booking-card-head">
                <div class="booking-title" :title="b.title">{{ b.title }}</div>
                <span
                  class="room-status-badge"
                  :class="statusBadgeClass(b.status)"
                >
                  {{ statusLabel(b.status) }}
                </span>
              </div>
              <div class="booking-meta">
                <div class="booking-meta-row">
                  <span class="booking-meta-label">时间</span>
                  <span class="booking-meta-value">
                    {{ formatMineDate(b.date) }} {{ b.start }} - {{ b.end }}
                  </span>
                </div>
                <div class="booking-meta-row">
                  <span class="booking-meta-label">会议室</span>
                  <span class="booking-meta-value">{{ formatMinePlace(b) }}</span>
                </div>
              </div>
              <div
                v-if="canChangeBooking(b.status)"
                class="booking-actions"
                @click.stop
              >
                <button
                  type="button"
                  class="booking-edit"
                  @click="emit('edit', b)"
                >
                  修改
                </button>
                <button
                  type="button"
                  class="booking-release"
                  @click="emit('release', b)"
                >
                  释放
                </button>
              </div>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </DialogOrSheet>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { AcEmpty } from "@/components/base";
import useMobileEnv from "@/composables/useMobileEnv";
import {
  canChangeBooking,
  defaultMineTab,
  formatMineDate,
  formatMinePlace,
  MINE_STATUS_LABEL,
  splitMineBookings
} from "../mine";
import DialogOrSheet from "./DialogOrSheet.vue";

const props = defineProps({
  bookings: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "release", "edit", "locate"]);

const { mobileEnv } = useMobileEnv();
const tab = ref(defaultMineTab(props.bookings));

const split = computed(() => splitMineBookings(props.bookings));
const live = computed(() => split.value.live);
const past = computed(() => split.value.past);
const visible = computed(() =>
  tab.value === "live" ? live.value : past.value
);

watch(
  () => props.loading,
  (loading) => {
    if (!loading) tab.value = defaultMineTab(props.bookings);
  }
);

const emptyHint = computed(() =>
  mobileEnv.value
    ? "在时间条上点选空闲时段即可预定"
    : "在时间轴上拖选空闲时段即可预定"
);

const tabEmptyTitle = computed(() =>
  tab.value === "live" ? "暂无待开始或进行中的预定" : "没有历史预定"
);

const statusLabel = (status) => MINE_STATUS_LABEL[status] || status;

const statusBadgeClass = (status) => {
  if (status === "ongoing" || status === "upcoming") return status;
  if (status === "ended" || status === "released") return status;
  return "upcoming";
};
</script>

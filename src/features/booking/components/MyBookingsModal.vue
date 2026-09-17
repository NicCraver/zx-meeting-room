<template>
  <DialogOrSheet
    :sheet="mobileEnv"
    title="我的预定"
    no-btn
    close-on-click-modal
    width="560px"
    class="mine-bookings-dialog"
    data-testid="mr-dialog-mine"
    @close="emit('close')"
  >
    <div class="bookings-dialog" data-testid="mr-dialog-mine-body">
      <div v-if="mobileEnv" class="sheet-header">
        <span id="bookings-dialog-title" class="sheet-title">我的预定</span>
        <button type="button" class="navbar-action" @click="emit('close')">
          关闭
        </button>
      </div>
      <div class="sheet-body bookings-dialog-body">
        <AcPageLoading
          v-if="loading"
          data-testid="mr-mine-loading"
          text="数据加载中..."
        />
        <AcEmpty
          v-else-if="!bookings.length"
          data-testid="mr-mine-empty"
          title="暂无预定"
        >
          <template #desc>
            <span class="text-caption text-mute">{{ emptyHint }}</span>
          </template>
        </AcEmpty>
        <template v-else>
          <section
            v-for="section in sections"
            :key="section.key"
            class="mine-section"
          >
            <h3
              class="mine-section-title"
              :data-testid="`mr-mine-section-${section.key}`"
            >
              {{ section.title }}
            </h3>
            <ul class="mine-booking-list">
              <li
                v-for="b in section.items"
                :key="b.id"
                class="mine-booking-card"
                data-testid="mr-mine-card"
                :data-booking-id="b.id"
                :data-booking-title="b.title"
              >
                <div class="mine-card-main">
                  <div class="mine-thumb">
                    <svg
                      class="mine-thumb-icon"
                      viewBox="0 0 48 48"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="10"
                        y="8"
                        width="28"
                        height="22"
                        rx="3"
                        fill="white"
                        fill-opacity="0.22"
                      />
                      <rect
                        x="14"
                        y="12"
                        width="20"
                        height="14"
                        rx="1.5"
                        stroke="white"
                        stroke-width="1.8"
                      />
                      <path
                        d="M18 32h12M24 30v4"
                        stroke="white"
                        stroke-width="1.8"
                        stroke-linecap="round"
                      />
                      <path
                        d="M17 22.5l4-4 3.2 2.6 5.8-6.1"
                        stroke="white"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="mine-card-copy">
                    <div class="mine-card-title-row">
                      <span
                        class="mine-card-name"
                        data-testid="mr-mine-title"
                        :title="b.title || '会议'"
                        >{{ b.title || "会议" }}</span
                      >
                      <span
                        v-if="showStatusBadge(b.status)"
                        class="room-status-badge"
                        :class="statusBadgeClass(b.status)"
                      >
                        {{ statusLabel(b.status) }}
                      </span>
                    </div>
                    <p class="mine-card-meta">会议室：{{ b.roomName }}</p>
                    <p class="mine-card-meta">时间：{{ formatMineWhen(b) }}</p>
                    <p class="mine-card-meta">
                      地址：{{ formatMineAddress(b) }}
                    </p>
                    <p
                      v-if="bookingRemark(b)"
                      class="mine-card-meta"
                      data-testid="mr-mine-remark"
                    >
                      说明：{{ bookingRemark(b) }}
                    </p>
                  </div>
                </div>
                <div v-if="canChangeBooking(b.status)" class="booking-actions">
                  <button
                    type="button"
                    class="booking-action-btn"
                    data-testid="mr-mine-release"
                    @click="emit('release', b)"
                  >
                    释放会议室
                  </button>
                </div>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </DialogOrSheet>
</template>

<script setup>
import { computed } from "vue";
import { AcEmpty, AcPageLoading } from "@/components/base";
import useMobileEnv from "@/composables/useMobileEnv";
import {
  bookingRemark,
  canChangeBooking,
  formatMineAddress,
  formatMineWhen,
  MINE_STATUS_LABEL,
  splitMineBookings
} from "../mine";
import DialogOrSheet from "./DialogOrSheet.vue";

const props = defineProps({
  bookings: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "release"]);

const { mobileEnv } = useMobileEnv();

const split = computed(() => splitMineBookings(props.bookings));
const live = computed(() => split.value.live);
const past = computed(() => split.value.past);

const sections = computed(() =>
  [
    { key: "live", title: "已预定", items: live.value },
    { key: "past", title: "已结束", items: past.value }
  ].filter((section) => section.items.length)
);

const emptyHint = computed(() =>
  mobileEnv.value
    ? "在时间条上点选空闲时段即可预定"
    : "在时间轴上拖选空闲时段即可预定"
);

const statusLabel = (status) => MINE_STATUS_LABEL[status] || status;

const showStatusBadge = (status) =>
  status === "ongoing" || status === "upcoming";

const statusBadgeClass = (status) => {
  if (status === "ongoing" || status === "upcoming") return status;
  if (status === "ended" || status === "released") return status;
  return "upcoming";
};
</script>

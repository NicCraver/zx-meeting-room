<template>
  <article
    class="ai-buddy-card ai-buddy-mine"
    data-testid="mr-ai-mine-card"
    aria-label="我的会议"
  >
    <h3 class="ai-buddy-card-title">我的会议</h3>
    <p v-if="lead" class="ai-buddy-mine-lead">{{ lead }}</p>
    <ul class="ai-buddy-mine-list">
      <li v-for="row in bookings" :key="row.id" class="ai-buddy-mine-row">
        <div class="ai-buddy-mine-head">
          <strong class="ai-buddy-mine-title">{{ row.title || "会议" }}</strong>
          <span
            v-if="statusLabel(row.status)"
            class="room-status-badge"
            :class="row.status"
          >
            {{ statusLabel(row.status) }}
          </span>
        </div>
        <p class="ai-buddy-mine-meta">{{ row.roomName }}</p>
        <p class="ai-buddy-mine-meta">{{ formatMineWhen(row) }}</p>
        <p v-if="bookingRemark(row)" class="ai-buddy-mine-meta">
          说明：{{ bookingRemark(row) }}
        </p>
      </li>
    </ul>
  </article>
</template>

<script setup>
import { computed } from "vue";
import {
  bookingRemark,
  formatMineWhen,
  MINE_STATUS_LABEL
} from "@/features/booking/mine.js";

const props = defineProps({
  text: { type: String, default: "" },
  bookings: { type: Array, default: () => [] }
});

const statusLabel = (status) => MINE_STATUS_LABEL[status] || "";

const lead = computed(() => {
  const n = props.bookings.length;
  const raw = String(props.text || "")
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (raw && raw.length <= 24) return raw;
  if (n > 1) return `共 ${n} 场`;
  return "";
});
</script>

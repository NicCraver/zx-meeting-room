<template>
  <article
    class="ai-buddy-card ai-buddy-confirm"
    data-testid="mr-ai-release"
    aria-label="确认释放"
  >
    <h3 class="ai-buddy-card-title">确认取消这场会？</h3>
    <dl class="ai-buddy-confirm-kv">
      <div>
        <dt>主题</dt>
        <dd>{{ booking.title || "会议" }}</dd>
      </div>
      <div>
        <dt>会议室</dt>
        <dd>{{ booking.roomName }}</dd>
      </div>
      <div>
        <dt>时间</dt>
        <dd>{{ booking.date }} {{ booking.start }}–{{ booking.end }}</dd>
      </div>
      <div v-if="bookingRemark(booking)">
        <dt>说明</dt>
        <dd>{{ bookingRemark(booking) }}</dd>
      </div>
    </dl>
    <div class="ai-buddy-card-actions">
      <button type="button" class="ai-buddy-btn-ghost" @click="emit('cancel')">
        返回
      </button>
      <button
        type="button"
        class="ai-buddy-btn-primary"
        data-testid="mr-ai-release-ok"
        @click="emit('confirm')"
      >
        确认释放
      </button>
    </div>
  </article>
</template>

<script setup>
import { bookingRemark } from "@/features/booking/mine.js";

defineProps({
  booking: { type: Object, required: true }
});

const emit = defineEmits(["confirm", "cancel"]);
</script>

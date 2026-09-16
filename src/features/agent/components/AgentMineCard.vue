<template>
  <article
    class="ai-buddy-card"
    data-testid="mr-ai-mine-card"
    aria-label="我的会议"
  >
    <h3 class="ai-buddy-card-title">我的会议</h3>
    <AgentMarkdown v-if="text" class="ai-buddy-card-copy" :source="text" />
    <ul class="ai-buddy-query-list">
      <li v-for="row in bookings" :key="row.id" class="ai-buddy-query-row">
        <div class="ai-buddy-query-meta">
          <strong>{{ row.title || "会议" }}</strong>
          <span>{{ row.roomName }} · {{ row.date }} {{ row.start }}–{{ row.end }}</span>
        </div>
      </li>
    </ul>
  </article>
</template>

<script setup>
import AgentMarkdown from "./AgentMarkdown.vue";

defineProps({
  text: { type: String, default: "" },
  bookings: { type: Array, default: () => [] }
});
</script>

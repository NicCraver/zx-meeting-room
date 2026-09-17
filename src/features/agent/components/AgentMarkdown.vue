<script setup>
import { computed } from "vue";
import { renderMarkdown } from "../renderMarkdown.js";

const props = defineProps({
  source: { type: String, default: "" }
});

const html = computed(() => renderMarkdown(props.source));
</script>

<template>
  <div v-if="html" class="ai-buddy-md" v-html="html" />
</template>

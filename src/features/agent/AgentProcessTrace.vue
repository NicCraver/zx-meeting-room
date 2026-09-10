<template>
  <ol v-if="steps.length" class="mt-4 flex flex-col gap-2">
    <li
      v-for="step in steps"
      :key="step.id"
      class="rounded-2 border border-edge p-3 text-3.5"
    >
      <div class="mb-1 font-medium">
        {{ step.title }}
        <span v-if="step.pending" class="ml-1 text-3 text-body">…</span>
      </div>
      <div
        v-if="step.kind === 'llm'"
        class="mt-2 min-h-16 whitespace-pre-wrap break-words rounded-2 bg-gray-light p-3 leading-6"
      >
        <span
          v-if="step.pending && !step.stream"
          class="animate-pulse text-body"
          >模型思考中…</span
        >
        <template v-else-if="step.stream">
          {{ step.stream }}<span
            v-if="step.pending"
            class="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-black align-[-2px]"
          />
        </template>
        <span
          v-else-if="step.resultKind === 'tool_call'"
          class="text-body"
          >本轮无文本，模型请求调用工具</span
        >
      </div>
      <pre
        v-if="step.detail"
        class="mt-2 whitespace-pre-wrap break-words text-3 text-body"
        >{{ step.detail }}</pre
      >
    </li>
  </ol>
</template>

<script setup>
defineProps({
  steps: {
    type: Array,
    default: () => []
  }
});
</script>

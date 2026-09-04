<template>
  <XPopup bg-transparent @close="emit('cancel')">
    <div class="m-action-sheet" @click.stop>
      <div class="m-action-desc">
        <strong>{{ title }}</strong>
        <span>{{ message }}</span>
      </div>
      <AcButton
        class="h-11 w-full"
        type="danger"
        :title="confirmText"
        @click="emit('confirm')"
      />
      <AcButton
        class="h-11 w-full mt-8px"
        title="取消"
        @click="emit('cancel')"
      />
    </div>
  </XPopup>
</template>

<script setup>
import { AcButton, XPopup } from "@/components/base";

defineProps({
  title: { type: String, default: "提示" },
  message: { type: String, required: true },
  confirmText: { type: String, default: "确定" }
});

defineEmits(["confirm", "cancel"]);
</script>

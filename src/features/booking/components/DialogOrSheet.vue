<script setup>
import { AcDialog, XPopup } from "@/components/base";

defineOptions({ inheritAttrs: false });

defineProps({
  sheet: { type: Boolean, default: false },
  title: { type: String, default: "" },
  noBtn: { type: Boolean, default: true },
  bgTransparent: { type: Boolean, default: false },
  preventMaskClose: { type: Boolean, default: false },
  closeOnClickModal: { type: Boolean, default: false }
});

defineEmits(["close", "submit"]);
</script>

<template>
  <XPopup
    v-if="sheet"
    :bg-transparent="bgTransparent"
    :prevent-mask-close="preventMaskClose"
    :z-index="3000"
    @close="$emit('close')"
  >
    <slot />
  </XPopup>
  <AcDialog
    v-else
    :title="title"
    :no-btn="noBtn"
    :close-on-click-modal="closeOnClickModal"
    v-bind="$attrs"
    @close="$emit('close')"
    @submit="$emit('submit')"
  >
    <template #content>
      <slot />
    </template>
  </AcDialog>
</template>

<template>
  <XPopup bg-transparent :z-index="3000" prevent-mask-close @close="emit('close')">
    <div class="m-action-sheet" @click.stop>
      <button
        type="button"
        data-testid="mine-open"
        class="h-11 w-full rounded-sm text-body-md border text-white bg-primary border-primary"
        @click="emit('openMine')"
      >
        我的预定
      </button>
      <button
        type="button"
        class="h-11 w-full mt-8px rounded-sm text-body-md border text-white bg-grayDark border-grayDark"
        @click="emit('switchUser')"
      >
        切换用户
      </button>
      <button
        type="button"
        class="h-11 w-full mt-8px rounded-sm text-body-md border text-white bg-grayDark border-grayDark"
        @click="emit('close')"
      >
        取消
      </button>
    </div>
  </XPopup>
</template>

<script setup>
import { XPopup } from "@/components/base";

const emit = defineEmits(["openMine", "switchUser", "close"]);
</script>

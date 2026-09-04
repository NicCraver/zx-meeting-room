<script setup lang="ts">
import type { XPopupProps, XPopupEmits } from "./types";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

/**
 * 移动端底部抽屉（apps/web/src/components/common/XPopup.vue 移植）。
 * 固定全屏遮罩 + Transition 从底部升起，白底 rounded-lg（令牌档位）。
 * props：maskTransparent / bgTransparent / preventMaskClose / zIndex / slide('bottom'|'left')。
 * 插槽：默认（抽屉内容）、center（居中浮层）。
 * 挂载即显示，popstate（浏览器返回）自动关闭，after-leave 后 emit("close")。
 */

const props = withDefaults(defineProps<XPopupProps>(), {
  maskTransparent: false,
  bgTransparent: false,
  zIndex: 100,
  preventMaskClose: false,
  beforeCloseFn: () => {},
  slide: "bottom"
});

const emit = defineEmits<XPopupEmits>();

const show = ref(false);
const rootEl = ref<HTMLElement | null>(null);

onMounted(() => {
  window.addEventListener("popstate", close);
  if (rootEl.value) document.body.appendChild(rootEl.value);
  nextTick(() => {
    show.value = true;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", close);
  rootEl.value?.remove();
});

async function close() {
  await props.beforeCloseFn();
  show.value = false;
}

function handleContentClick(e: MouseEvent) {
  e.stopPropagation();
  if ((e.target as HTMLElement).nodeName === "A") {
    e.preventDefault();
  }
}

function handleAfterLeave() {
  emit("close");
}
</script>

<template>
  <div
    ref="rootEl"
    class="x-popup-root fixed left-0 right-0 top-0 h-full text-body-md transition duration-200"
    :class="{ 'bg-black/33': !maskTransparent && show }"
    :style="{ zIndex }"
    @click="!preventMaskClose && close()"
  >
    <Transition @after-leave="handleAfterLeave">
      <div
        v-show="show"
        :class="[
          'absolute',
          slide === 'left' ? 'top-0 h-full slide-left' : 'w-full bottom-0',
          { 'bg-canvas rounded-t-lg': !bgTransparent }
        ]"
        @click="handleContentClick"
      >
        <slot />
      </div>
    </Transition>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <slot name="center" />
    </div>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: transform 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  transform: translateY(100%);
}

.slide-left.v-enter-from,
.slide-left.v-leave-to {
  transform: translateX(-100%);
}
</style>

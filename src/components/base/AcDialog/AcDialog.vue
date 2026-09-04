<script setup lang="ts">
import type { AcDialogProps, AcDialogEmits } from "./types";
import { ref } from "vue";
import AcButton from "../AcButton";

/**
 * PC 端弹窗（apps/web/src/components/common/AcDialog.vue 移植）。
 * 基于 el-dialog：`#F4F6F8` 标题栏（→ canvas-soft）、8px 圆角、内置取消/确定脚部。
 * 插槽：custom-header / content / footer-left / footer-before-actions。
 * 默认禁用点遮罩与 Esc 关闭；确定 → emit("submit")，取消 → emit("close")。
 */

const props = withDefaults(defineProps<AcDialogProps>(), {
  title: "",
  titleTip: "",
  buttonTip: "",
  submitTitle: "",
  cancelTitle: "",
  closeOnClickModal: false
});

const emit = defineEmits<AcDialogEmits>();

/**
 * 命令式用法：挂载即显示。el-dialog 需要 modelValue 才渲染内容，
 * 关闭路径只有 emit("close")（遮罩/Esc 已禁用），wrapper 收到后 unmount。
 */
const visible = ref(true);
</script>

<template>
  <el-dialog
    v-model="visible"
    :close-on-click-modal="props.closeOnClickModal"
    :close-on-press-escape="false"
    :destroy-on-close="true"
    :show-close="false"
    :append-to-body="true"
    class="!p-0 !rounded-lg flex flex-col"
    header-class="!pb-0"
    footer-class="!pt-0"
    body-class="flex-1 min-h-0 overflow-hidden flex flex-col"
    v-bind="$attrs"
    @click.stop
  >
    <template #header>
      <span
        class="flex items-center justify-between h-12 pl-4 shrink-0 bg-grayLight rounded-t-lg"
        :class="{
          '!bg-transparent border-b': splitTheme,
          '!h-auto': $slots['custom-header']
        }"
      >
        <slot name="custom-header" v-if="$slots['custom-header']" />
        <span
          v-else
          class="flex items-center gap-1 whitespace-nowrap overflow-hidden"
        >
          <span class="text-body-md text-black font-semibold truncate">{{
            title
          }}</span>
          <span v-if="titleTip" class="text-caption text-grayMedium">{{
            titleTip
          }}</span>
        </span>
        <span
          class="flex items-center justify-center shrink-0 w-12 h-12 ml-4 self-start"
        >
          <span
            class="i-carbon-close w-4 h-4 shrink-0 cursor-pointer text-grayDark hover:text-primary"
            role="button"
            tabindex="0"
            aria-label="关闭"
            title="关闭"
            @click="emit('close')"
            @keydown.enter="emit('close')"
          ></span>
        </span>
      </span>
    </template>

    <div class="px-4 pt-4 w-full flex-1 min-h-0 flex flex-col overflow-hidden">
      <slot name="content" />
    </div>

    <template #footer>
      <div
        v-if="!noBtn"
        class="flex items-center gap-4 shrink-0 w-full h-16 px-4"
        :class="{ 'border-t': splitTheme }"
      >
        <div class="flex items-center flex-1 min-w-0 overflow-hidden">
          <slot name="footer-left" />
        </div>
        <div class="flex items-center justify-end gap-2 shrink-0">
          <slot name="footer-before-actions" />
          <span
            v-if="buttonTip"
            class="text-caption text-black truncate max-w-32 min-w-0"
          >
            {{ buttonTip }}
          </span>
          <AcButton
            class="h-8 shrink-0"
            plain
            @click="emit('close')"
            :title="cancelTitle || '取消'"
          />
          <AcButton
            class="h-8 shrink-0"
            :class="submitClass"
            type="primary"
            @click="emit('submit')"
            :title="submitTitle || '确定'"
            :disabled="submitDisabled"
            :loading="btnLoading"
          />
        </div>
      </div>
    </template>
  </el-dialog>
</template>

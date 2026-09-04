<template>
  <AdminShell active="dicts">
    <div class="flex flex-col gap-16px">
      <div class="flex items-start justify-between gap-16px">
        <div>
          <h1 class="m-0 text-20px font-600 leading-32px text-black">字典表</h1>
          <p class="mt-4px mb-0 text-13px leading-18px text-grayDark">
            维护会议室表单使用的建筑、设施选项。默认已内置奥城 /
            生态城，以及电视 / 白板 / 投影。
          </p>
        </div>
        <AcButton
          type="primary"
          :title="`新增${typeLabel}`"
          @click="openCreate"
        />
      </div>

      <div class="flex gap-8px" role="tablist" aria-label="字典类型">
        <button
          v-for="tab in DICT_TYPES"
          :key="tab.id"
          type="button"
          role="tab"
          class="h-32px px-14px border rounded-20px text-13px inline-flex items-center gap-6px cursor-pointer font-inherit"
          :class="
            activeType === tab.id
              ? 'bg-primaryLight border-primaryBorder text-primary font-500'
              : 'bg-canvas border-hairline text-black'
          "
          :aria-selected="activeType === tab.id"
          @click="setActiveType(tab.id)"
        >
          {{ tab.label }}
          <span class="text-11px opacity-75">{{ typeCounts[tab.id] }}</span>
        </button>
      </div>

      <div class="zx-card !p-0 overflow-hidden">
        <el-table v-loading="loading" :data="rows" class="w-full">
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column label="引用" width="120">
            <template #default="{ row }">
              {{ formatUsage(row.usageCount) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <ZxStatusTag
                :tone="row.enabled ? 'done' : 'todo'"
                :label="row.enabled ? '启用中' : '已停用'"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260">
            <template #default="{ row }">
              <AcButton
                type="primary"
                plain
                title="编辑"
                @click="openEdit(row)"
              />
              <AcButton
                v-if="row.enabled"
                type="danger"
                plain
                title="停用"
                @click="toggleEnabled(row)"
              />
              <AcButton
                v-else
                type="primary"
                plain
                title="启用"
                @click="toggleEnabled(row)"
              />
              <AcButton type="danger" plain title="删除" @click="remove(row)" />
            </template>
          </el-table-column>
          <template #empty>
            <div class="py-48px">
              <AcEmpty :title="`暂无${typeLabel}字典`">
                <template #desc>
                  <AcButton
                    type="primary"
                    :title="`新增${typeLabel}`"
                    @click="openCreate"
                  />
                </template>
              </AcEmpty>
            </div>
          </template>
        </el-table>
      </div>
    </div>

    <AcDialog
      v-if="dialogVisible"
      :title="dialogTitle"
      width="400px"
      :btn-loading="saving"
      submit-title="保存"
      @submit="submit"
      @close="closeEditor"
    >
      <template #content>
        <div class="flex flex-col gap-14px pb-16px">
          <div>
            <label class="block mb-6px text-13px leading-20px" for="dict-name">
              名称
            </label>
            <el-input
              id="dict-name"
              :model-value="draftName"
              maxlength="20"
              :placeholder="namePlaceholder"
              @update:model-value="onDraftNameInput"
            />
          </div>
          <div>
            <label class="block mb-6px text-13px leading-20px" for="dict-sort">
              排序
            </label>
            <el-input
              id="dict-sort"
              class="w-140px"
              type="number"
              min="1"
              :model-value="draftSort"
              @update:model-value="draftSort = $event"
            />
          </div>
          <div v-if="formError" class="text-13px text-danger" role="alert">
            {{ formError }}
          </div>
        </div>
      </template>
    </AcDialog>
  </AdminShell>
</template>

<script setup>
import { computed } from "vue";
import { AcButton, AcDialog, AcEmpty, ZxStatusTag } from "@/components/base";
import AdminShell from "./AdminShell.vue";
import { useAdminGate } from "./useAdminGate";
import { DICT_TYPES, useDicts } from "./useDicts";

const { ready, isAdmin } = useAdminGate();
const active = computed(() => ready.value && isAdmin.value);

const {
  loading,
  saving,
  activeType,
  typeLabel,
  typeCounts,
  rows,
  dialogVisible,
  dialogTitle,
  namePlaceholder,
  draftName,
  draftSort,
  formError,
  setActiveType,
  openCreate,
  openEdit,
  closeEditor,
  onDraftNameInput,
  submit,
  toggleEnabled,
  remove
} = useDicts({ active });

const formatUsage = (count) => (count > 0 ? `${count} 间会议室` : "未使用");
</script>

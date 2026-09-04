<template>
  <div class="zx-card !p-0 overflow-hidden">
    <el-table v-loading="loading" :data="rooms" class="w-full">
      <el-table-column label="名称" min-width="160">
        <template #default="{ row }">
          <div>{{ row.name }}</div>
          <div
            v-if="row.groupName"
            class="text-12px leading-18px text-grayMedium"
          >
            分组：{{ row.groupName }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="buildingName" label="建筑" min-width="100" />
      <el-table-column prop="floorName" label="楼层" min-width="80" />
      <el-table-column label="位置描述" min-width="140">
        <template #default="{ row }">
          <span v-if="row.locationDesc">{{ row.locationDesc }}</span>
          <span v-else class="text-grayMedium">-</span>
        </template>
      </el-table-column>
      <el-table-column label="容纳人数" width="90">
        <template #default="{ row }">{{ row.capacity }}人</template>
      </el-table-column>
      <el-table-column label="设施" min-width="160">
        <template #default="{ row }">
          {{ formatFacilities(row.facilities, dicts) }}
        </template>
      </el-table-column>
      <el-table-column label="开放时间" width="140">
        <template #default="{ row }">
          {{ row.openStart }} - {{ row.openEnd }}
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
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <AcButton
            type="primary"
            plain
            title="编辑"
            @click="$emit('edit', row.id)"
          />
          <AcButton
            v-if="row.enabled"
            type="danger"
            plain
            title="停用"
            @click="$emit('toggle', row)"
          />
          <AcButton
            v-else
            type="primary"
            plain
            title="启用"
            @click="$emit('toggle', row)"
          />
        </template>
      </el-table-column>
      <template #empty>
        <div class="py-48px">
          <AcEmpty :title="hasFilter ? '没有符合条件的会议室' : '暂无会议室'">
            <template #desc>
              <AcButton
                v-if="hasFilter"
                title="重置筛选"
                @click="$emit('reset')"
              />
              <AcButton
                v-else
                type="primary"
                title="新建会议室"
                @click="$emit('create')"
              />
            </template>
          </AcEmpty>
        </div>
      </template>
    </el-table>
    <div
      v-if="total > 0"
      class="flex items-center justify-between px-16px py-12px border-t border-edge"
    >
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="$emit('update:page', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { AcButton, AcEmpty, ZxStatusTag } from "@/components/base";
import { formatFacilities } from "../format";

defineProps({
  rooms: { type: Array, default: () => [] },
  dicts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  hasFilter: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 }
});

defineEmits(["edit", "toggle", "create", "reset", "update:page"]);
</script>

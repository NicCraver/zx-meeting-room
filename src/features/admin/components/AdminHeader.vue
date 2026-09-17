<template>
  <header
    class="h-56px shrink-0 bg-canvas border-b border-edge flex items-center justify-between px-20px gap-16px select-none z-10"
  >
    <!-- 左侧：侧栏折叠按钮 + 面包屑导航 -->
    <div class="flex items-center gap-14px min-w-0">
      <!-- 快捷折叠切换器 -->
      <button
        type="button"
        class="w-32px h-32px rounded-6px flex items-center justify-center text-body hover:text-black hover:bg-canvasSoft border-none bg-transparent cursor-pointer transition-colors duration-150 shrink-0"
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="emit('toggle-collapse')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <!-- 面包屑导航 -->
      <nav
        class="flex items-center gap-8px text-13px text-mute min-w-0"
        aria-label="页面层级面包屑"
      >
        <router-link
          to="/admin"
          class="hover:text-primary text-mute no-underline transition-colors duration-150 flex items-center gap-4px shrink-0"
        >
          <span>管理平台</span>
        </router-link>

        <span class="text-edge shrink-0 select-none" aria-hidden="true">/</span>

        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.label">
          <router-link
            v-if="crumb.path && index < breadcrumbs.length - 1"
            :to="crumb.path"
            class="hover:text-primary text-mute no-underline transition-colors duration-150 truncate max-w-140px"
          >
            {{ crumb.label }}
          </router-link>
          <span
            v-else
            class="text-black font-500 truncate max-w-180px"
            :aria-current="
              index === breadcrumbs.length - 1 ? 'page' : undefined
            "
          >
            {{ crumb.label }}
          </span>

          <span
            v-if="index < breadcrumbs.length - 1"
            class="text-edge shrink-0 select-none"
            aria-hidden="true"
          >
            /
          </span>
        </template>
      </nav>
    </div>

    <!-- 右侧：快捷工具与管理员状态 -->
    <div class="flex items-center gap-12px shrink-0">
      <!-- 快捷刷新按钮 -->
      <el-tooltip
        content="刷新当前数据"
        placement="bottom"
        :offset="8"
        effect="dark"
      >
        <button
          type="button"
          class="w-32px h-32px rounded-6px flex items-center justify-center text-body hover:text-black hover:bg-canvasSoft border border-edge/80 bg-canvas cursor-pointer transition-all duration-150"
          :class="{ 'opacity-60 pointer-events-none': refreshing }"
          aria-label="刷新当前数据"
          @click="handleRefresh"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ 'animate-spin': refreshing }"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
        </button>
      </el-tooltip>

      <!-- 返回预定看板（前台）按钮 -->
      <button
        type="button"
        class="h-32px px-10px rounded-6px flex items-center gap-6px text-12px font-500 text-body hover:text-primary hover:border-primaryBorder hover:bg-primaryLight/50 border border-edge/80 bg-canvas cursor-pointer transition-all duration-150"
        title="返回会议室看板（前台预定）"
        @click="goBookingBoard"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>前台看板</span>
      </button>

      <div class="h-16px w-1px bg-edge shrink-0 mx-2px" aria-hidden="true" />

      <!-- 管理员权限与身份微标 -->
      <div class="flex items-center gap-8px">
        <div
          class="h-28px px-8px rounded-pill bg-successLight text-success border border-success/30 flex items-center gap-6px text-12px font-500"
          title="您当前具备管理员操作权限"
        >
          <span
            class="w-6px h-6px rounded-full bg-success"
            aria-hidden="true"
          />
          <span>管理权限</span>
        </div>

        <div class="flex items-center gap-6px text-13px text-black pl-4px">
          <div
            class="w-26px h-26px rounded-full bg-primary/10 text-primary border border-primaryBorder/60 flex items-center justify-center text-11px font-600"
            aria-hidden="true"
          >
            管
          </div>
          <span class="font-500 text-12px hidden sm:inline-block"
            >系统管理</span
          >
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  active: {
    type: String,
    default: "rooms"
  }
});

const emit = defineEmits(["toggle-collapse", "refresh"]);

const route = useRoute();
const router = useRouter();
const refreshing = ref(false);

const handleRefresh = () => {
  if (refreshing.value) return;
  refreshing.value = true;
  emit("refresh");
  setTimeout(() => {
    refreshing.value = false;
  }, 600);
};

const goBookingBoard = () => {
  router.push("/");
};

/** 动态计算当前路径面包屑 */
const breadcrumbs = computed(() => {
  const path = route.path || "";

  if (path.includes("/admin/rooms/new")) {
    return [{ label: "会议室管理", path: "/admin" }, { label: "新建会议室" }];
  }

  if (path.includes("/admin/rooms/")) {
    return [{ label: "会议室管理", path: "/admin" }, { label: "编辑会议室" }];
  }

  if (path.includes("/admin/history")) {
    return [{ label: "预定记录与审计" }];
  }

  if (path.includes("/admin/dicts")) {
    return [{ label: "基础字典表" }];
  }

  // 默认是会议室列表
  if (props.active === "history") {
    return [{ label: "预定记录与审计" }];
  }
  if (props.active === "dicts") {
    return [{ label: "基础字典表" }];
  }
  return [{ label: "会议室管理" }];
});
</script>

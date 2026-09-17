<template>
  <aside
    class="relative shrink-0 bg-canvas border-r border-edge flex flex-col justify-between select-none transition-all duration-200 ease-out z-10"
    :class="collapsed ? 'w-68px' : 'w-240px'"
    aria-label="管理平台侧边栏导航"
  >
    <!-- 顶部品牌 Logo 区 -->
    <div class="flex flex-col">
      <div
        class="h-56px border-b border-edge/80 flex items-center px-16px gap-12px overflow-hidden cursor-pointer"
        :class="collapsed ? 'justify-center px-0' : 'justify-start'"
        title="智信 · 智能会议室管理平台"
        @click="goAdminHome"
      >
        <div
          class="admin-brand-mark w-34px h-34px shrink-0 rounded-8px text-onPrimary flex items-center justify-center shadow-sm"
          aria-hidden="true"
        >
          <!-- 会议室与大屏设计图标 -->
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="12" rx="2" ry="2" />
            <line x1="8" y1="20" x2="16" y2="20" />
            <line x1="12" y1="16" x2="12" y2="20" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        </div>

        <div
          v-if="!collapsed"
          class="min-w-0 flex-1 flex flex-col justify-center transition-opacity duration-150"
        >
          <div class="flex items-center gap-6px">
            <span class="text-14px font-600 leading-20px text-black truncate">
              智能会议室
            </span>
            <span
              class="text-10px font-500 leading-14px px-5px py-1px rounded-pill bg-primaryLight text-primary border border-primaryBorder/60 shrink-0"
            >
              管理端
            </span>
          </div>
          <span class="text-11px leading-16px text-mute truncate">
            企业空间控制台
          </span>
        </div>
      </div>

      <!-- 菜单导航列表 -->
      <nav
        class="flex flex-col gap-14px py-16px px-10px"
        aria-label="管理后台主菜单"
      >
        <div
          v-for="(group, groupIndex) in navGroups"
          :key="group.title"
          class="flex flex-col gap-4px"
        >
          <!-- 分组小标题（展开时展示，折叠时用细分割线过渡） -->
          <div
            v-if="!collapsed"
            class="px-10px pt-2px pb-4px text-11px font-500 text-mute tracking-wider uppercase truncate"
          >
            {{ group.title }}
          </div>
          <div
            v-else-if="groupIndex > 0"
            class="h-1px bg-edge/70 my-4px mx-8px"
            aria-hidden="true"
          />

          <div v-for="item in group.items" :key="item.id" class="w-full">
            <!-- 折叠模式下的 Tooltip 包裹 -->
            <el-tooltip
              :disabled="!collapsed"
              :content="`${item.label} · ${item.desc}`"
              placement="right"
              :offset="12"
              effect="dark"
            >
              <router-link
                :to="item.path"
                :data-testid="`mr-admin-nav-${item.id}`"
                class="group relative flex items-center rounded-8px cursor-pointer no-underline transition-all duration-150"
                :class="[
                  collapsed
                    ? 'w-44px h-44px mx-auto justify-center'
                    : 'w-full h-40px px-12px justify-start gap-10px',
                  active === item.id
                    ? 'bg-primaryLight/80 text-primary font-500 shadow-xs'
                    : 'text-body hover:bg-canvasSoft hover:text-black'
                ]"
                :aria-current="active === item.id ? 'page' : undefined"
              >
                <!-- 展开时的左侧指示高亮蓝条 -->
                <span
                  v-if="!collapsed && active === item.id"
                  class="absolute left-0 top-6px bottom-6px w-3px rounded-r-pill bg-primary"
                  aria-hidden="true"
                />

                <!-- 导航图标（统一风格与尺寸） -->
                <span
                  class="shrink-0 flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
                  :class="
                    active === item.id
                      ? 'text-primary'
                      : 'text-body group-hover:text-black'
                  "
                >
                  <!-- 会议室管理 -->
                  <svg
                    v-if="item.id === 'rooms'"
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
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>

                  <!-- 预定记录与审计 -->
                  <svg
                    v-else-if="item.id === 'history'"
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
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                    <path d="M18.36 5.64A9 9 0 0 0 4 12h2" />
                  </svg>

                  <!-- 基础字典表 -->
                  <svg
                    v-else
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
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path
                      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    />
                    <path d="M8 7h8M8 11h6" />
                  </svg>
                </span>

                <!-- 展开时的菜单标题与辅助描述 -->
                <div
                  v-if="!collapsed"
                  class="min-w-0 flex-1 flex items-center justify-between overflow-hidden"
                >
                  <span class="text-13px leading-18px truncate">
                    {{ item.label }}
                  </span>
                  <span
                    v-if="active === item.id"
                    class="w-6px h-6px rounded-full bg-primary shrink-0 ml-4px"
                    aria-hidden="true"
                  />
                </div>
              </router-link>
            </el-tooltip>
          </div>
        </div>
      </nav>
    </div>

    <!-- 底部操作与折叠控制器 -->
    <div class="border-t border-edge/80 p-10px flex flex-col gap-6px">
      <!-- 快捷前往预定看板（前台入口） -->
      <el-tooltip
        :disabled="!collapsed"
        content="前往会议室预定看板（前台）"
        placement="right"
        :offset="12"
        effect="dark"
      >
        <button
          type="button"
          class="w-full flex items-center rounded-8px text-body hover:text-black hover:bg-canvasSoft cursor-pointer border-none bg-transparent transition-colors duration-150 py-8px"
          :class="collapsed ? 'justify-center px-0 h-40px' : 'px-10px gap-10px'"
          title="前往前台预约看板"
          @click="goBookingBoard"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0"
            aria-hidden="true"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          <span v-if="!collapsed" class="text-13px leading-18px truncate">
            预定看板
          </span>
        </button>
      </el-tooltip>

      <!-- 侧边栏折叠/展开切换按钮 -->
      <button
        type="button"
        class="w-full flex items-center rounded-8px text-mute hover:text-black hover:bg-canvasSoft cursor-pointer border-none bg-transparent transition-colors duration-150 py-8px"
        :class="
          collapsed ? 'justify-center px-0 h-36px' : 'px-10px justify-between'
        "
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="emit('toggle-collapse')"
      >
        <div v-if="!collapsed" class="flex items-center gap-8px text-12px">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          <span>收起菜单</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-transform duration-200"
          :class="collapsed ? 'rotate-180' : ''"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <!-- 管理员运行状态微指示（展开态） -->
      <div
        v-if="!collapsed"
        class="px-10px py-6px rounded-6px bg-canvasSoft text-11px text-mute flex items-center justify-between"
      >
        <span class="truncate">智信 · 管理权限已生效</span>
        <span
          class="w-6px h-6px rounded-full bg-success shrink-0"
          title="在线"
        />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from "vue-router";

defineProps({
  active: {
    type: String,
    required: true,
    validator: (value) =>
      value === "rooms" || value === "dicts" || value === "history"
  },
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["toggle-collapse"]);
const router = useRouter();

const navGroups = [
  {
    title: "空间与资源",
    items: [
      {
        id: "rooms",
        label: "会议室管理",
        desc: "会议室主数据、位置与设施",
        path: "/admin"
      }
    ]
  },
  {
    title: "运营与审计",
    items: [
      {
        id: "history",
        label: "预定记录",
        desc: "全量预定流转与操作审计",
        path: "/admin/history"
      }
    ]
  },
  {
    title: "系统配置",
    items: [
      {
        id: "dicts",
        label: "基础字典表",
        desc: "建筑、楼层与设施配置",
        path: "/admin/dicts"
      }
    ]
  }
];

const goAdminHome = () => {
  router.push("/admin");
};

const goBookingBoard = () => {
  router.push("/");
};
</script>

<template>
  <div class="flex h-full min-h-full w-full overflow-hidden bg-grayLight">
    <!-- 无障碍：键盘跳到主内容区域 -->
    <a
      class="sr-only focus:not-sr-only focus:fixed focus:top-12px focus:left-12px focus:z-50 focus:px-12px focus:py-8px focus:bg-primary focus:text-onPrimary focus:rounded-6px focus:shadow-md"
      href="#admin-main"
    >
      跳到主内容
    </a>

    <!-- 侧边栏导航 -->
    <AdminSidebar
      :active="active"
      :collapsed="collapsed"
      @toggle-collapse="toggleCollapse"
    />

    <!-- 右侧主体：顶栏 + 主工作区 -->
    <div class="flex-1 min-w-0 min-h-0 flex flex-col bg-grayLight">
      <!-- 统一管理顶栏 -->
      <AdminHeader
        :active="active"
        :collapsed="collapsed"
        @toggle-collapse="toggleCollapse"
        @refresh="handleRefresh"
      />

      <!-- 主工作区内容容器 -->
      <main
        id="admin-main"
        class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden gutter-stable"
        tabindex="-1"
      >
        <div
          class="w-full max-w-1680px mx-auto p-16px md:p-20px lg:p-24px min-h-full"
        >
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AdminSidebar from "./components/AdminSidebar.vue";
import AdminHeader from "./components/AdminHeader.vue";

defineProps({
  active: {
    type: String,
    required: true,
    validator: (value) =>
      value === "rooms" || value === "dicts" || value === "history"
  }
});

const emit = defineEmits(["refresh"]);
const router = useRouter();

const STORAGE_KEY = "mr_admin_sidebar_collapsed";
const collapsed = ref(false);

onMounted(() => {
  // 从本地存储读取用户折叠偏好
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    collapsed.value = saved === "true";
  } else if (window.innerWidth < 1080) {
    // 较小屏幕默认折叠
    collapsed.value = true;
  }
});

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed.value));
  } catch {
    // ignore storage quota error
  }
};

const handleRefresh = () => {
  emit("refresh");
  // 触发软刷新或重新加载当前路由
  router.replace({
    path: router.currentRoute.value.path,
    query: {
      ...router.currentRoute.value.query,
      _t: Date.now()
    }
  });
};
</script>

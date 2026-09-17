import "@unocss/reset/tailwind.css";
import "uno.css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "vant/es/toast/style";
import "vant/es/dialog/style";
import "@/style.css";

import { createApp } from "vue";
import App from "./App.vue";
import { createAppRouter } from "@/router";
import { applyDeviceEnv } from "@/composables/useMobileEnv";
import { bootstrapAuth } from "@/features/auth/bootstrapAuth";
import routes from "~zx-pages";
import "@vant/touch-emulator";

applyDeviceEnv();

// 登录态引导属于应用启动步骤，必须在挂载前完成；带 userCode 时要换 token，所以是异步的。
// 换不出来也照常挂载（页面会提示从智信打开）。
// router 必须在引导之后再建：createWebHistory 建的时候就快照了当时的地址，
// 提前建会在挂载时把已经摘掉的 userCode 又推回地址栏。
bootstrapAuth().finally(() => {
  const router = createAppRouter(routes, "zx/");
  createApp(App).use(router).mount("#app");
});

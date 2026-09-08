/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "path";

import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import {
  ElementPlusResolver,
  VantResolver
} from "unplugin-vue-components/resolvers";
import { codeInspectorPlugin } from "code-inspector-plugin";

import exportConfig from "./export.config.js";
import { autoApiExports } from "./src/plugins/vite-auto-api-exports.js";
import { autoExportAssets } from "./src/plugins/vite-auto-assets-exports.js";
import { mpaPlugin } from "./src/plugins/vite-mpa-plugin.js";
import { createPagesPlugins } from "./src/plugins/vite-pages-config.js";

// 部署 base，与 Jenkins moduleName / 测试机路径一致
const base = "/ai-meet/";

// MPA 构建目标
const buildTarget = process.env.BUILD_TARGET || "main";
const buildEntries = {
  main: "index.html", // 主应用
  zx: "zx/index.html", // 桌面端（PC WebView）
  m: "m/index.html" // 移动端（iOS / 安卓 WebView）
};

/**
 * 按入口裁掉用不到的 UI 库——但两侧不对称：
 *
 * - zx 入口恒为 pc 形态 → 不需要 vant，JS 与样式两个别名都裁：已确认 src 里
 *   没有任何 `<van-` 模板会被自动导入，Vant 组件在 zx 上不可达，唯一受影响的
 *   只有三个 main.js 里显式引入的 vant 样式，裁掉是安全的。
 * - m 入口只裁 JS 别名（转发 dialog.js 里不可达的 ElMessage / ElMessageBox 到
 *   Vant），**不裁 element-plus 样式**：DateTimeRangeField.vue 在所有入口
 *   （包括 m）都无条件渲染真实的 el-date-picker / el-popover /
 *   el-config-provider，裁掉样式会直接导致这几个组件在 m 上样式丢失，是真实的
 *   视觉回归，之前已实测验证（167 处 → 3 处），故 m 只做 JS 重定向。
 *   注：m 上这条裸标识符别名不止转发 ElMessage / ElMessageBox——同一个
 *   `element-plus` specifier 下的 ElScrollbar 也会被替身接管，它只被
 *   src/features/agent/components/BookingAiBar.vue 用到，而该组件在 m 入口不可达，
 *   所以目前是安全的死代码路径，别以为别名只影响弹框/toast 两个函数。
 * main 是独立 Web，可能被手机浏览器打开（resolveDevice 走 UA），两套都要留。
 */
const shim = (name) => resolve(import.meta.dirname, `build/shims/${name}`);

const uiTrimAliases = () => {
  if (buildTarget === "m") {
    return [{ find: /^element-plus$/, replacement: shim("element-plus.js") }];
  }
  if (buildTarget === "zx") {
    return [
      { find: /^vant\/es\/.*\/style$/, replacement: shim("empty.css") },
      { find: /^vant$/, replacement: shim("vant.js") }
    ];
  }
  return [];
};

export default defineConfig(({ mode }) => {
  const isVitest = Boolean(process.env.VITEST);
  return {
    base,
    server: {
      // dev 反向代理：/api 走智信网关；会议室接口打 contact Java
      proxy: {
        "/api": "http://192.168.10.25",
        "/meetingApi": {
          target: "http://localhost:7004",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/meetingApi/, "/meetingRoom")
        }
      },
      host: "0.0.0.0",
      port: 6273
    },
    preview: { port: 6273 },
    plugins: isVitest
      ? [vue()]
      : [
          codeInspectorPlugin({
            bundler: "vite",
            injectTo: [
              resolve(import.meta.dirname, "src/main.js"), // main 入口
              resolve(import.meta.dirname, "src/mpa/desktop/main.js"), // zx 入口
              resolve(import.meta.dirname, "src/mpa/mobile/main.js") // m 入口
            ],
            behavior: { copy: true }
          }),
          vue(),
          UnoCSS(),
          AutoImport({ resolvers: [ElementPlusResolver(), VantResolver()] }),
          Components({ resolvers: [ElementPlusResolver(), VantResolver()] }),
          autoExportAssets(exportConfig),
          autoApiExports(),
          ...createPagesPlugins(),
          mpaPlugin(base)
        ],
    define: {
      JENKINS_BUILD_NUMBER: JSON.stringify(
        process.env.BUILD_NUMBER || "NOT_JENKINS_CI"
      ),
      // 构建目标（main/zx/m），供运行期区分宿主形态
      __BUILD_TARGET__: JSON.stringify(buildTarget)
    },
    resolve: {
      alias: [
        { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
        ...uiTrimAliases()
      ]
    },
    test: {
      include: [
        "src/features/**/tests/*.test.js",
        "build/shims/tests/*.test.js"
      ],
      environment: "node"
    },
    build: {
      // 9 个 SvgIcon 图标 0.23–2.15 KB，内联成 data URI 可省下 9 次 WebView 往返；
      // SvgIcon 的 mask-image 已按 data URL 处理引号（见 SvgIcon.vue 注释）
      assetsInlineLimit: 4096,
      ...(mode !== "development" && { outDir: `dist_${buildTarget}` }),
      rollupOptions: {
        input:
          mode === "development"
            ? Object.fromEntries(
                Object.entries(buildEntries).map(([k, v]) => [
                  k,
                  resolve(import.meta.dirname, v)
                ])
              )
            : {
                [buildTarget]: resolve(
                  import.meta.dirname,
                  buildEntries[buildTarget]
                )
              },
        output: {
          // rolldown 的分组配置（不是 rollup 的 manualChunks，在 rolldown 下不生效）。
          // 目的是让第三方库和业务代码分开缓存：业务改动不再使 vendor 整体失效。
          // 注意：未加 element-plus 分组——试过之后 main/zx 首屏 gzip 涨了 24%~25%，
          // 因为 element-plus 在多个路由里都有用到，分组会把全量组件强行合并进一个
          // chunk，导致本该按路由异步加载的部分被拖进首屏 eager 图。element-plus
          // 目前继续交给 rolldown 默认分包（按实际引用点自然拆分）。
          // 用 codeSplitting 而不是 advancedChunks：后者已标记 @deprecated（见
          // rolldown 类型定义 define-config-*.d.mts），两者同时设置时 advancedChunks
          // 会被忽略，且 groups 的 { name, test } 结构完全一致，直接改名即可。
          codeSplitting: {
            groups: [
              {
                name: "vendor-vue",
                test: /node_modules[\\/](vue|@vue|vue-router)[\\/]/
              },
              { name: "vendor-vant", test: /node_modules[\\/]vant[\\/]/ },
              {
                name: "vendor-base",
                test: /node_modules[\\/](axios|dayjs|is-mobile)[\\/]/
              }
            ]
          }
        }
      }
    }
  };
});

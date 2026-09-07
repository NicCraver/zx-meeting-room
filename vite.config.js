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
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
    },
    test: {
      include: ["src/features/**/tests/*.test.js"],
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

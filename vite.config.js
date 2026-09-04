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
const base = "/zx-ai-meet/";

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
      assetsInlineLimit: 0,
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
              }
      }
    }
  };
});

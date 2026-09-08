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
 * - zx 入口恒为 pc 形态 → dialog.js 里的 Vant 分支不可达，裁两个别名：`vant` 裸
 *   specifier（转发 dialog.js 的具名导入）+ `vant/es/<dir>/style` 精确路径（三处
 *   main.js 里 `vant/es/toast/style` / `vant/es/dialog/style` 这两条静态样式
 *   import）。**这两个别名只覆盖以上这三处已知的静态 import**，覆盖不到
 *   unplugin-vue-components 的 VantResolver 自动导入——它给组件生成的是
 *   `from: "vant/es"`、给样式生成的是 `vant/es/<dir>/style/index`（带 /index），
 *   两个别名都不匹配。真正撑住 zx 裁库收益的不是这两个别名，而是「src 里没有
 *   任何 `<van-` 模板」这条代码事实：一旦有人写了 `<van-button>`，VantResolver
 *   会绕开两个别名直接引入完整 Vant，构建照样通过，字节收益悄悄消失而没有任何
 *   报错。这条事实现在由 `build/shims/tests/import-coverage.test.js` 里的守卫
 *   测试断言，不是靠别名本身保证的。
 * - m 入口裁 JS 别名（转发 dialog.js 里不可达的 ElMessage / ElMessageBox 到
 *   Vant）+ 两条具名列出的 element-plus 弹窗样式深路径（message /
 *   message-box）：这两条样式在 m 上唯一的消费者就是 dialog.js 的 Element Plus
 *   分支，已经被上面那条 JS 别名整体重定向到 Vant，样式因此是确定的死代码，
 *   实测裁掉后 CSS 体积下降、且不影响 date-picker 家族（167 处 el-popper /
 *   el-picker-panel / el-date-editor 类名不变）。**不裁其余 element-plus
 *   样式**：`DateTimeRangeField.vue` 在所有入口（包括 m）都无条件渲染真实的
 *   el-date-picker / el-popover / el-config-provider，裁掉这些样式会直接导致
 *   组件在 m 上样式丢失，是真实的视觉回归，之前已实测验证过一次（167 处 →
 *   3 处）。**样式别名必须逐条具名列出，绝不能用通配符**——通配符会把
 *   date-picker 家族一起裁掉，就是上面那次回归的成因。
 *   注：m 上裸标识符别名不止转发 ElMessage / ElMessageBox——同一个
 *   `element-plus` specifier 下的 ElScrollbar 也会被替身接管，它只被
 *   src/features/agent/components/BookingAiBar.vue 用到，而该组件在 m 入口不可达，
 *   所以目前是安全的死代码路径，别以为别名只影响弹框/toast 两个函数。
 * main 是独立 Web，可能被手机浏览器打开（resolveDevice 走 UA），两套都要留。
 */
const shim = (name) => resolve(import.meta.dirname, `build/shims/${name}`);

const uiTrimAliases = () => {
  if (buildTarget === "m") {
    return [
      { find: /^element-plus$/, replacement: shim("element-plus.js") },
      // 具名列出，不用通配符：只裁 dialog.js 已重定向到 Vant 的两个弹窗样式，
      // date-picker 等其余 element-plus 样式必须保留（见上方注释）。
      {
        find: "element-plus/es/components/message/style/css",
        replacement: shim("empty.css")
      },
      {
        find: "element-plus/es/components/message-box/style/css",
        replacement: shim("empty.css")
      }
    ];
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

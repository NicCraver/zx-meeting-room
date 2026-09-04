# 智能会议室（apps/meeting）

前端仓库（Vue 3 + Vite 8 MPA，三入口 main/zx/m）。后端在 `apps/contact`（Java）。
内嵌于智信 PC / iOS / 安卓 WebView。架构地图见上级仓库 `context/platforms/meeting.md`。

## 环境要求
- Node 22.16.0 / pnpm 10.22.0（根 `package.json#volta` 锁定）。

## 常用命令
| 场景 | 命令（在 `apps/meeting/` 根执行） |
|------|------|
| 安装依赖 | `pnpm i` |
| 起前端 | `pnpm dev`（端口 6273，`/api`→192.168.10.25，`/meetingApi`→Java 7004 `/meetingRoom`） |
| 全量构建 | `pnpm build`（vue-tsc → main/zx/m → mergeDist） |
| 生产构建 | `pnpm build:prod` |
| 仅类型检查 | `pnpm typecheck` |
| 单测 | `pnpm test`（Vitest 5） |
| 单测 UI | `pnpm test:ui` |
| UI E2E | `pnpm test:e2e`（Playwright，需 Java :7004 + 前端 :6273） |
| UI E2E 看着跑 | `pnpm test:e2e:headed` 弹出浏览器；`pnpm test:e2e:ui` 逐步点选用例 |
| 格式化 | `pnpm format` |

> ⚠️ 没有 ESLint。类型检查用 `vue-tsc`（已内嵌在 `build`）。
> `tsconfig.json` 是 `checkJs: false`，源码又以 JS 为主，所以 `vue-tsc` 实际只对
> `.ts` / `.d.ts` 生效，**不检查现有 JS 文件与 `.vue` 里的 `<script>`（JS）脚本块**——
> JS 部分出错不会被类型检查拦下，仍需人工 review。

## 代码规范
- Vue 3 Composition API + `<script setup>`；组合式函数放 `src/composables/`，命名 `useXxx`。**不引入** Pinia/Vuex。
- 功能目录：`src/features/booking`（预定看板）/ `agent`（助手）/ `admin`（管理端）/ `race`（抢订）/ `demo`。接口客户端 `src/api/`。
- JS 为主，工具/类型可用 TS。中文注释。
- 样式统一 UnoCSS 原子类 + `uno.config.js` 主题 token；Element Plus / Vant 按需自动注册，**不要整包 import**。
- 新接口写到 `src/api/module/<域>.js`，导出命名函数；走 `src/api/http.js` 的 axios 实例。
- 路由文件式（`vite-plugin-pages`）：主应用 `src/pages`、桌面 `src/mpa/desktop/pages`、移动 `src/mpa/mobile/pages`。**别放错目录。**
- 功能内聚：一个功能域一个目录，单测集中到该功能的 `tests/`。

## 多入口注意事项
- 三个 HTML 入口各有独立 `main.js`。**新增全局插件、全局样式、全局指令必须同步三处**
  （`src/main.js`、`src/mpa/desktop/main.js`、`src/mpa/mobile/main.js`）。
- 部署 base 固定 `/meeting/`，改动需同步 `vite.config.js` 与部署侧。
- 取 token 一律走 `src/utils/index.js` 的 `bootstrapAuthFromUrl()`；将来接 JSBridge 也只改这一个函数。

## 生成物勿动
`src/api/index.js`、`src/assets/index.ts`、`components.d.ts`、`auto-imports.d.ts` —— 均由插件生成，已在 `.gitignore`。

## 提交前自检
1. `pnpm format`
2. `pnpm build` 通过
3. 改了接口 → 同步 `context/contracts/` 并在活跃功能 `impl-notes.md` 记一笔

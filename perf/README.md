# 前端性能度量

会议室前端（`apps/meeting`）构建配置优化（分支 `perf/build-config`）配套的两个度量脚本，
及本轮优化前后的实测对照。**只用来度量本仓库自己的构建产物变化，不代表线上真实网络下的
用户体验**（无网络限速、无服务端预压缩、无 CDN）。

## 两条命令

### 1. `pnpm perf:size [--json <path>] [--compare <path>]`

跑 `scripts/perf-size.mjs`，直接读磁盘上已有的构建产物（`dist_main` / `dist_zx` / `dist_m`），
统计三个入口的**首屏 eager 资源**体积（raw + gzip）与产物总体积。用前必须先 `pnpm build`
生成这三个目录，脚本本身不触发构建。

- 不带参数：打印三入口的明细表格（每个文件的 raw / gzip）。
- `--json <path>`：把本次结果写成快照 JSON（如 `perf/after.json`）。
- `--compare <path>`：额外打印当前结果与指定快照的首屏 raw / gzip 差值表。

### 2. `pnpm perf:e2e`

跑 `playwright test --config playwright.perf.config.js`（`e2e-perf/load.spec.js`），用真实
Chromium 打开三个入口，量 `requests`（首屏请求数）、`transferBytes`（首屏传输字节，含压缩）、
`domContentLoaded` / `load` / `fcp` / `appFirstPaint` 几个时间点，写入 `perf/e2e-latest.json`。

**同样需要先 `pnpm build`**——它打的不是 dev server，而是 `vite preview` 服务的构建产物。

`playwright.perf.config.js` 的 `webServer.command` 里那个 `--outDir dist` **绝对不能删**：
`vite.config.js` 在非 `development` 模式下会把 `outDir` 覆写成 `dist_${buildTarget}`（三个入口
各自独立输出，互不覆盖）。`vite preview` 不加 `--outDir` 时默认只服务 `dist_main`，此时对
`/ai-meet/zx/` 和 `/ai-meet/m/` 的请求会被 SPA fallback 到 main 的 `index.html`，三个入口量出
来的其实是同一份数据——本轮真的踩过这个坑，教训记在这里。`--outDir dist` 指向的是
`mergeDist.js` 把三份产物合并后的 `dist/` 目录，服务的才是各自入口真实的 HTML。

## 快照文件

| 文件                     | 生成命令 / 时间                                                      | 对应的构建配置                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `perf/baseline.json`     | `pnpm perf:size --json perf/baseline.json`，2026-09-04T09:24:22.690Z | 本轮优化前（Task 1 建立基线时的 `vite.config.js`），无内联、无分包、无裁库                                                             |
| `perf/after.json`        | `pnpm perf:size --json perf/after.json`，2026-09-08T08:47:12.319Z    | 本轮 Task 3/4/6 全部落地后（`assetsInlineLimit: 4096` + `codeSplitting.groups` 三分组 + zx 裁 vant / m 重定向 element-plus specifier） |
| `perf/e2e-baseline.json` | `pnpm perf:e2e`，2026-09-04T09:37:26.549Z                            | 同 `baseline.json` 的构建配置                                                                                                          |
| `perf/e2e-latest.json`   | `pnpm perf:e2e`，2026-09-08T08:47:52.036Z                            | 同 `after.json` 的构建配置                                                                                                             |

## 「首屏 eager 资源」判定口径

取自产物 `index.html` 里 Vite 注入的三类标签（见 `scripts/perf-size.mjs` 的 `eagerFiles()`）：

- `<script type="module" src="...">`（entry script）
- `<link rel="modulepreload" href="...">`
- `<link rel="stylesheet" href="...">`

三类是浏览器渲染首屏前必须下载的资源；路由懒加载的 chunk（比如 `RoomFormPage`、`admin` 等
异步页面）不计入，因为它们不阻塞首屏。`perf:e2e` 的 `requests` / `transferBytes` 是浏览器实测
的首屏请求，口径与之对应但不完全相同（实测会包含浏览器自身的探测请求，如 favicon）。

## 单位口径提醒

`perf-size.mjs` 的 `kb()` 是 `raw / 1024`，标注 "KB"（二进制，1 KB = 1024 B）；而 `vite build`
构建日志打印的体积是十进制 kB（1 kB = 1000 B）。两者相差约 2.4%，**不是脚本或 vite 哪个错了，
是进制不同**。因此：

- 只能拿 `perf:size` 的两次快照互相比较（本 README 的对照表全部来自快照互比）。
- 不要拿 `perf:size` 的数字跟同一次 `pnpm build` 终端日志里的数字直接比大小，两者标的都是
  "KB"/"kB" 但进制不同，看着差一点不代表统计错了。

## 优化前后对照（实测，非预估）

### `pnpm perf:size --compare perf/baseline.json`（2026-09-08 实测）

```
入口      首屏 raw 变化              首屏 gzip 变化
main      +8.17 KB (+1.0%)           +3.25 KB (+1.2%)
zx        -82.36 KB (-10.0%)         -39.72 KB (-15.2%)
m         -10.71 KB (-1.4%)          -1.98 KB (-0.8%)
```

首屏 eager 绝对值（`perf/after.json`）：

| 入口 | 首屏 eager raw | 首屏 eager gzip | 产物总计   |
| ---- | -------------- | --------------- | ---------- |
| main | 836.83 KB      | 266.04 KB       | 1143.60 KB |
| zx   | 743.79 KB      | 221.24 KB       | 1043.19 KB |
| m    | 751.82 KB      | 237.29 KB       | 751.82 KB  |

### `pnpm perf:e2e`（Playwright 实测，`perf/e2e-baseline.json` → `perf/e2e-latest.json`）

| 入口 | requests（基线→本轮） | transferBytes（基线→本轮） | load（基线→本轮） |
| ---- | --------------------- | -------------------------- | ----------------- |
| main | 9 → 13                | 270247 B → 273054 B        | 90.8ms → 98.4ms   |
| zx   | 6 → 8                 | 268119 B → 227577 B        | 54.7ms → 38.2ms   |
| m    | 3 → 8                 | 245237 B → 243532 B        | 57.0ms → 43.4ms   |

`requests` 三入口全部**上升**——这是 Task 4 分包（vendor-vue / vendor-vant / vendor-base 三个
独立 chunk）的直接代价：拆分后 HTTP 往返变多，换来的是浏览器缓存粒度更细（vendor 不随业务代码
改动失效），Task 4 提交信息里已写明"first-load bytes unchanged by design"。Task 3 的 svg 内联
本应减少请求数，但被分包新增的请求数抵消，所以净值是上升的。`load` 时间三入口都在个位/十位毫秒
级波动（本机 headless Chromium + localhost，无网络延迟），噪声占比高，不作为本轮结论依据，仅供
参考。

## 收益分布：如实记录，不均匀

本轮字节收益**集中在 zx**（首屏 gzip -15.2%），m 几乎没动（-0.8%），main 反而**涨了**
（+1.2%）。这不是回归，是可解释的已知代价：

- **zx** 大幅下降：Task 6 把 vant 从 zx 入口整体裁掉（zx 场景不需要移动端组件库），加上分包让
  vendor-vue / vendor-base 的收益也算进来。
- **m** 几乎不变：`src/features/booking/components/DateTimeRangeField.vue` 是三端通用组件，
  不受 `resolveDevice()` 控制，在 m 入口会无条件渲染真实的 `<el-date-picker>` / `<el-popover>`
  （element-plus 组件）。所以 m 只能重定向 JS 裸 `element-plus` specifier（把顶层 import 转发到
  按需子路径），**绝不能裁它的样式深路径**——裁样式会导致这个通用组件在 m 端视觉回归。裁库收益
  因此被限制得很小。
- **main** 反而 +1.2%：svg 内联（Task 3，为省 9 次 HTTP 往返，字节本身 +2.3 KB gzip）与分包
  （Task 4，vendor chunk 拆分带来的元数据/运行时开销）在 main 入口没有被任何裁库收益抵消
  （main 不做裁库，见下一段），两项代价直接累加体现在首屏字节上。

**根因未解决**：`src/utils/dialog.js` 静态 `import` 了 element-plus 和 vant 两套 UI 库，又被
`src/utils/index.js` 再导出，导致任何引用 `utils/index.js` 的入口都会把两套弹窗库一起带上
首屏。三个入口能做的裁剪都被这一点封顶——main 完全没法裁（业务代码到处 `import` 自
`utils/index.js`），zx / m 也只能靠构建期 alias 绕开，绕不掉 `dialog.js` 本身的静态 import。
真正的瘦身需要拆 `dialog.js`（比如按需动态 `import()` 各自的弹窗实现），但这是源码改动，本期
「只改构建配置、不碰 `src/`」的约束下不做，留给后续迭代。

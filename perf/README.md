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
`domContentLoaded` / `load` / `fcp` / `appFirstPaint` 几个时间点，默认写入 `perf/.last/e2e.json`
（gitignored 的临时文件，跑了不会污染 / 覆盖仓库里追踪的快照）。所有 spec 都跑完且三个入口的
数据都拿到了才会写；只要有一个入口的 spec 失败，`afterAll` 直接跳过写文件，不会留下一份看着
完整、其实缺一角的假快照。

**同样需要先 `pnpm build`**——它打的不是 dev server，而是 `vite preview` 服务的构建产物。

**这两个字节/请求指标和 `perf:size` 高度重复，不是一条独立的测量维度**：六次真实运行（基线 +
本轮各三入口）里，`requests` 无一例外等于 `perf:size` 算出的 eager 文件数，`transferBytes` 与
`eagerGzip` 只差 0.5–1.1 KB——那点差值是 preview 把响应即时压缩后再传输本身带来的开销，不是
测到了 `perf:size` 之外的东西。`perf:e2e` 今天真正提供的、`perf:size` 给不了的东西只有两样：
一是 `domContentLoaded` / `load` / `fcp` / `appFirstPaint` 这几个时间点——下面已经说了本机
headless Chromium + localhost 下噪声占比高，不作为结论依据；二是「页面在真实 Chromium 里确实
挂载起来了」这条兜底断言（`expect(timing.appFirstPaint).not.toBeNull()`），构建配置改错到页面
挂不起来时能第一时间被它抓到。除此之外，不要把它当成一条独立于 `perf:size` 的测量轴。

`playwright.perf.config.js` 的 `webServer.command` 里那个 `--outDir dist` **绝对不能删**：
`vite.config.js` 在非 `development` 模式下会把 `outDir` 覆写成 `dist_${buildTarget}`（三个入口
各自独立输出，互不覆盖）。`vite preview` 不加 `--outDir` 时默认只服务 `dist_main`，此时对
`/ai-meet/zx/` 和 `/ai-meet/m/` 的请求会被 SPA fallback 到 main 的 `index.html`，三个入口量出
来的其实是同一份数据——本轮真的踩过这个坑，教训记在这里。`--outDir dist` 指向的是
`mergeDist.js` 把三份产物合并后的 `dist/` 目录，服务的才是各自入口真实的 HTML。

## 快照文件

| 文件                     | 生成命令 / 时间                                                      | 对应的构建配置                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `perf/baseline.json`     | `pnpm perf:size --json perf/baseline.json`                           | 本轮优化前（Task 1 建立基线时的 `vite.config.js`），无内联、无分包、无裁库                                                             |
| `perf/after.json`        | `pnpm perf:size --json perf/after.json`                              | 本轮全部落地后（`assetsInlineLimit: 4096` + `codeSplitting.groups` 三分组 + zx 裁 vant / m 重定向 element-plus specifier + m 具名裁两个弹窗样式深路径） |
| `perf/e2e-baseline.json` | `pnpm perf:e2e`，输出复制自当时的默认落盘文件（历史遗留，早于本轮 gitignore 改造） | 同 `baseline.json` 的构建配置                                                                                                          |
| `perf/e2e-after.json`    | `pnpm perf:e2e` 后手动把 `perf/.last/e2e.json` 复制过来                | 同 `after.json` 的构建配置                                                                                                             |

`perf/e2e-baseline.json` / `perf/e2e-after.json` 是**追踪进仓库的快照**，代表两次里程碑的实测
结果，不会被日常运行覆盖。`pnpm perf:e2e` 平时跑出来的数据默认落在 `perf/.last/e2e.json`
（已加入 `.gitignore` 的临时文件）——只有专门要更新这两份里程碑快照时，才手动把
`perf/.last/e2e.json` 的内容复制过去、提交进仓库。

## 「首屏 eager 资源」判定口径

取自产物 `index.html` 里 Vite 注入的三类标签（见 `scripts/perf-size.mjs` 的 `eagerFiles()`）：

- `<script type="module" src="...">`（entry script）
- `<link rel="modulepreload" href="...">`
- `<link rel="stylesheet" href="...">`

三类是浏览器渲染首屏前必须下载的资源；路由懒加载的 chunk（比如 `RoomFormPage`、`admin` 等
异步页面）不计入，因为它们不阻塞首屏。`perf:e2e` 的 `requests` / `transferBytes` 是浏览器实测
的首屏请求，口径与之对应，实测下来两边数字是对得上的：favicon 落在部署 base（`/ai-meet/`）
之外的站点根路径 `/favicon.ico`，`e2e-perf/load.spec.js:74` 的 `url.includes("/ai-meet/")`
过滤本来就会把它挡在统计之外，不存在"实测比产物文件数多算了浏览器探测请求"这回事——六次真实
运行里 `requests` 都精确等于 eager 文件数，一个不多一个不少（详见下一节「优化前后对照」和
「两条命令」里对这两个指标重复度的说明）。

## 单位口径提醒

`perf-size.mjs` 的 `kb()` 是 `raw / 1024`，标注 "KB"（二进制，1 KB = 1024 B）；而 `vite build`
构建日志打印的体积是十进制 kB（1 kB = 1000 B）。两者相差约 2.4%，**不是脚本或 vite 哪个错了，
是进制不同**。因此：

- 只能拿 `perf:size` 的两次快照互相比较（本 README 的对照表全部来自快照互比）。
- 不要拿 `perf:size` 的数字跟同一次 `pnpm build` 终端日志里的数字直接比大小，两者标的都是
  "KB"/"kB" 但进制不同，看着差一点不代表统计错了。

## 优化前后对照（实测，非预估）

### `pnpm perf:size --compare perf/baseline.json`（2026-09-08 实测，含 m 端具名裁两个弹窗样式深路径后的结果）

```
入口      首屏 raw 变化              首屏 gzip 变化
main      +9.38 KB (+1.1%)           +3.62 KB (+1.4%)
zx        -82.28 KB (-10.0%)         -39.69 KB (-15.2%)
m         -19.79 KB (-2.6%)          -3.43 KB (-1.4%)
```

首屏 eager 绝对值（`perf/after.json`）：

| 入口 | 首屏 eager raw | 首屏 eager gzip | 产物总计   |
| ---- | -------------- | --------------- | ---------- |
| main | 838.04 KB      | 266.42 KB       | 1149.49 KB |
| zx   | 743.87 KB      | 221.27 KB       | 1043.27 KB |
| m    | 742.74 KB      | 235.83 KB       | 742.74 KB  |

`main` 的对照值比这份 README 早前版本记录的略高（原 +8.17 KB / +3.25 KB gzip）——不是这轮改动
引入的回归：工作区里本来就有一份和本次构建配置收尾无关、尚未提交的功能改动（`src/api/http.js` /
`vite.config.js` 的 `aiChatApi` 代理等），`pnpm build` 打的是磁盘上的工作区文件而不是某次
commit，这部分改动天然会体现在 `main`/`zx` 的产物字节里。m 端的下降幅度从 -1.4%/-0.8% 提升到
-2.6%/-1.4%，是本轮新增的「具名裁两个弹窗样式深路径」贡献的，细节见下面「收益分布」一节。

### `pnpm perf:e2e`（Playwright 实测，`perf/e2e-baseline.json` → `perf/e2e-after.json`）

| 入口 | requests（基线→本轮） | transferBytes（基线→本轮） | load（基线→本轮） |
| ---- | --------------------- | -------------------------- | ----------------- |
| main | 9 → 13                | 270247 B → 273437 B        | 90.8ms → 114.3ms  |
| zx   | 6 → 8                 | 268119 B → 227607 B        | 54.7ms → 44.4ms   |
| m    | 3 → 8                 | 245237 B → 242036 B        | 57.0ms → 48.2ms   |

`requests` 三入口全部**上升**——但这条测量只测到了 Task 4 分包的代价，**测不到 Task 3 svg
内联的收益，一丁点都测不到**。原因：`SvgIcon.vue` 把图标解析成 `?url` 字符串，浏览器只有在
图标真正渲染出来时才会发请求去下载它；而 `e2e-perf/load.spec.js` 把 `meetingApi` 接口 mock 成
`data: null`，首屏因此不渲染任何业务图标，内联省下来的那 9 次往返从一开始就不在这份数据的
观测范围里。核对上面的 `requests` 数字就能验证这一点：基线 9/6/3、本轮 13/8/8，跟
`perf/baseline.json` / `perf/after.json` 里的首屏 eager 文件数（`<script>` + `modulepreload`
+ `stylesheet`）逐入口对得严丝合缝——也就是说**这次测出来的请求数变化 100% 来自 Task 4
分包，跟 svg 内联毫无关系**。准确的说法不是"内联的收益被分包新增的请求数抵消了"（那意味着
两者都被计入、只是相互抵消），而是**内联的收益在这份 e2e 数据里从头到尾就没被计进去过**——
观测不到不等于被抵消了。要真正测出内联省了几次往返，需要另起一份首屏会渲染出真实图标的 e2e
fixture（比如把 `meetingApi` mock 成带业务数据的响应），当前这份"首屏图标全灭"的 fixture 做
不到。`load` 时间三入口都在个位/十位毫秒级波动（本机 headless Chromium + localhost，无网络
延迟），噪声占比高，不作为本轮结论依据，仅供参考。

## 收益分布：如实记录，不均匀

本轮字节收益**集中在 zx**（首屏 gzip -15.2%），m 只动了一点点（-1.4%），main 反而**涨了**
（+1.4%）。这不是回归，是可解释的已知代价：

- **zx** 大幅下降：把 vant 从 zx 入口整体裁掉（zx 场景不需要移动端组件库），加上分包让
  vendor-vue / vendor-base 的收益也算进来。
- **m** 动了一点：`src/features/booking/components/DateTimeRangeField.vue` 是三端通用组件，
  不受 `resolveDevice()` 控制，在 m 入口会无条件渲染真实的 `<el-date-picker>` / `<el-popover>`
  （element-plus 组件），所以 date-picker 家族的样式**绝不能裁**——裁了会导致这个通用组件在
  m 端视觉回归（167 处 `el-popper` / `el-picker-panel` / `el-date-editor` 类名，裁样式深路径
  会把它们连带裁没）。但 `dialog.js` 里的 Element Plus 分支已经被裸 `element-plus` specifier
  的 JS 别名整体重定向到 Vant，它唯二用到的两条样式深路径
  （`element-plus/es/components/message/style/css` / `.../message-box/style/css`）因此是
  确定的死代码，本轮补上了这两条**具名列出**（不是通配符）的样式别名，实测 m 的 CSS raw
  从 237735 B 降到 228355 B（-9380 B，约 -9.16 KB），`el-badge__content` 作为搭车收益也从
  10 处清零到 0 处（大概率是构建把它和 message/message-box 打进了同一个 CSS chunk，不是被
  专门针对的）；date-picker 家族的类名计数验证前后都是 167，没有回归。产物里仍能各查到 1 处
  `el-message--success` / `el-message-box__btns`——那不是漏裁，是 `src/style.css`（三处
  `main.js` 全局引入、本期约束下不能碰）里手写的同名选择器覆盖规则，跟 element-plus 自带的
  组件样式包是两回事，不属于这次能裁的范围。
- **main** 反而 +1.4%：svg 内联（为省 9 次 HTTP 往返，字节本身 +2.3 KB gzip）与分包
  （vendor chunk 拆分带来的元数据/运行时开销）在 main 入口没有被任何裁库收益抵消
  （main 不做裁库，见下一段），两项代价直接累加体现在首屏字节上。

**根因未解决**：`src/utils/dialog.js` 静态 `import` 了 element-plus 和 vant 两套 UI 库，又被
`src/utils/index.js` 再导出，导致任何引用 `utils/index.js` 的入口都会把两套弹窗库一起带上
首屏。三个入口能做的裁剪都被这一点封顶——main 完全没法裁（业务代码到处 `import` 自
`utils/index.js`），zx / m 也只能靠构建期 alias 绕开，绕不掉 `dialog.js` 本身的静态 import。
真正的瘦身需要拆 `dialog.js`（比如按需动态 `import()` 各自的弹窗实现），但这是源码改动，本期
「只改构建配置、不碰 `src/`」的约束下不做，留给后续迭代。

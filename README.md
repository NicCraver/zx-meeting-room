# zx-meeting-room

智能会议室前端。业务接口走编排仓 `apps/contact`（zx-contact，端口 **7004**），本仓库不再带 Node 服务端。

Vue 3 + Vite 8，MPA 三入口：`index.html`（独立浏览器）/ `zx/`（PC WebView）/ `m/`（iOS·安卓 WebView），dev 端口 **6273**，base `/meeting/`。

Vite 代理（`vite.config.js`）：

| 浏览器路径 | 实际打到 |
|------------|----------|
| `/meetingApi` | Java `localhost:7004`，前缀改写成 `/meetingRoom` |
| `/api` | 智信网关 `192.168.10.25` |

## 本机联调（前端 + Java）

在编排仓根目录 `ai-dev-workspace` 操作。先起 Java（冷启动约 1 分钟），再起前端。

```bash
# 1) contact Java —— 必须 JDK 8（本机 corretto），且绕过 Clash 系统代理
export JAVA_HOME=/Users/nic/Library/Java/JavaVirtualMachines/corretto-1.8.0_392/Contents/Home
cd apps/contact
# 没有 jar 时：mvn -o -DskipTests package
java "-DsocksNonProxyHosts=192.168.*|10.*|127.0.0.1|localhost" \
     "-Dhttp.nonProxyHosts=192.168.*|10.*|127.0.0.1|localhost" \
     -jar target/zx-contact-1.0.0.jar \
     --eureka.client.register-with-eureka=false
# 探活：http://localhost:7004/swagger-ui.html → 200
```

```bash
# 2) 会议室前端
cd apps/meeting
pnpm i          # 首次
pnpm dev        # http://localhost:6273/meeting/
```

本机 query 鉴权（`AAuthFilter` 读 query，不读 header；`zxClientType` 必须是 `app` 或 `webapp`）：

```
http://localhost:6273/meeting/?zxAccountId=1880150187008081921&zxCorpId=6&zxClientType=app
```

| 字段 | 值 | 说明 |
|------|-----|------|
| accountId | `1880150187008081921` | 登录账号，不是 `hostUserId` |
| corpId | `6` | |
| user.id | `1880150191235940353` | 企业内用户；管理员白名单 `meeting.admin.userIds` 用这个 |
| 姓名 | 李权泓 | `/meetingRoom/me` 的 `userName`，`isAdmin=true` |

PC 入口：`http://localhost:6273/meeting/zx/`（同一套 query）。移动：`/meeting/m/`。

助手芯片同样走 `/meetingApi` → Java `/meetingRoom`（含 `/agent/turn`）。

## 其它命令

```bash
pnpm build        # web 三入口 → mergeDist，产出 web/dist/
pnpm build:prod
pnpm test         # Vitest 单测
pnpm test:e2e     # Playwright UI E2E（需 Java 7004）
pnpm typecheck
pnpm format       # 只作用于 src/
```

`/usr/libexec/java_home -v 1.8` 在本机是 Applets JRE（无 javac），不要用。裸 `mvn` 会落到 JDK 26，必须先 export `JAVA_HOME`。Clash 会掐 JVM 内网连接，启动须带上面两条 `nonProxyHosts`。

文档：

- 需求：`docs/智能会议室-需求文档.md`
- 规格：`docs/智能会议室-规格说明.md`
- 编排仓约定：`context/platforms/meeting.md`、`context/platforms/contact.md`

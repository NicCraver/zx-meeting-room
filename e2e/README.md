# 会议室前端 E2E

## 怎么跑

```bash
# 在 apps/meeting 根。默认不打 Java。
pnpm test            # Vitest 单测（含 admin 纯函数 + mock store）
pnpm test:e2e        # Playwright，内存 mock，pc + mobile 并行
pnpm test:quality    # 单测 + 默认 E2E
pnpm test:e2e:live   # 真 contact :7004 冒烟；Java 没起则 skip
```

默认 `pnpm test:e2e` 会起 `pnpm dev`（6273）。已有 dev server 会 reuse。

## 定位优先级

1. `getByTestId('mr-…')`
2. `getByRole` / `getByLabel` / `getByPlaceholder`（稳定产品文案）
3. **不要**用 Uno/业务 class 当主定位

testid 约定：`mr-<区域>-<控件>`，kebab-case。列表项加 `data-room-id` / `data-booking-id`。

## 怎么加用例

1. 需要的控件若没有 testid，先打在 Vue 上，再写测试。
2. 默认套件用 `createStore(overrides)` + `openMeeting(page, { store })`（见 `e2e/helpers/open.js`）。
3. 时钟冻结在 `2026-09-15T10:00+08:00`（`e2e/helpers/clock.js`），种子占用/预定都相对这一天。
4. 未识别的会议室接口路径回 `M9999`，不要依赖真后端。
   mock 同时拦 `/meetingApi` 与 `/api/contact/v1/meetingRoom`。
   `/aiChatApi/v1/aiMeet` 走内存 SSE（第一枪 tool_call，第二枪 text）；助手工具仍打被拦截的 board/mine/create/release。
5. 打真实 Java 的用例只放 `e2e/live/`，由 `pnpm test:e2e:live` 跑。

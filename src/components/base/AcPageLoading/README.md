# AcPageLoading 整页加载组件

生产来源：`apps/web/src/components/common/AcPageLoading.vue`（四端一致）。

整页/区块加载态：旋转环 primary 色 + 居中文案，全屏或占满容器居中。用于数据就绪前的过渡，**不要**在页面里自己写 loading 样式。

## 使用约定

- 整页加载：页面组件用 `v-else` 配数据就绪态切换，默认文案「页面加载中...」。
- 列表/弹窗内加载：传 `text="数据加载中..."`。
- 在非 `#F4F6F8`（canvas-soft）背景的容器里使用时，外部覆盖背景色（如 `class="bg-white"`）。

## Props

| 名称   | 类型     | 默认              | 说明     |
| ------ | -------- | ----------------- | -------- |
| `text` | `string` | `'页面加载中...'` | 加载文案 |

Emits / Slots：无。

## 用法

```vue
<!-- 整页加载 -->
<AcPageLoading v-if="!pageReady" />

<!-- 列表内数据加载 -->
<AcPageLoading v-if="!listReady" text="数据加载中..." />
```

视觉令牌：旋转环 `--zx-color-primary-border` / `--zx-color-primary`，背景 `--zx-color-canvas-soft`，文字 `--zx-color-mute`。无硬编码色值。

类型与 mock：`types.ts`（AcPageLoadingProps）/ `mock.ts`（pageLoadingVariants 文案场景）。

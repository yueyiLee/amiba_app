# 阿米巴数字助理 · 移动端（amoeba_app）项目规则

## 一、项目定位

本项目是「阿米巴经营数字助理」的**移动端**，基于 **unibest** 脚手架（uni-app + Vue3 + TypeScript + Vite5 + UnoCSS），主要发布目标为**微信小程序**，同时兼容 H5 / APP。

后端接口由同工作区的 `amiba_digital_assistant`（Node.js + Express）提供，路径前缀 `/api`。

## 二、技术栈

- **框架**：uni-app + Vue3 `<script setup>` + TypeScript
- **构建**：Vite5，命令行开发，**无需 HBuilderX**
- **样式**：UnoCSS 原子化 CSS
- **状态**：Pinia（支持持久化）
- **路由**：约定式路由（`definePage` 宏自动生成 `pages.json`）
- **组件库**：wot-design-uni 等（详见 `package.json`）
- **包管理**：pnpm

## 三、目录结构

```
src/
├── pages/          # 页面（约定式路由，文件路径即路由）
├── components/     # 全局组件（局部组件放页面同级 /components/）
├── layouts/        # 布局
├── api/            # 按业务域拆分的接口定义
├── http/           # 请求封装（http.ts / interceptor.ts）
├── store/          # Pinia stores
├── hooks/          # 组合式函数
├── utils/          # 工具函数
├── tabbar/         # 底部导航配置
├── static/         # 静态资源
├── App.ku.vue      # 全局根组件模板
└── pages.json      # 自动生成，勿手改
```

核心配置：`vite.config.ts`、`pages.config.ts`、`manifest.config.ts`、`uno.config.ts`。

## 四、开发命令

```bash
pnpm dev            # H5
pnpm dev:mp         # 微信小程序
pnpm dev:app        # APP
pnpm build          # 生产构建
pnpm build:mp       # 小程序生产构建
```

小程序调试：用微信开发者工具打开 `dist/dev/mp-weixin`。

## 五、编码规范（强制）

- **TypeScript 优先**，避免 `any`；对象类型用 `interface`，联合类型用 `type`；导入类型用 `import type`。
- **必须为所有 API 响应定义接口类型**，禁止裸用 `any` 接住后端数据。
- 缩进 2 空格，单引号，**不写分号**（遵循项目 ESLint/Prettier 配置，提交前跑 lint）。
- 命名：组件文件 `PascalCase`；变量/函数 `camelCase`；常量 `UPPER_SNAKE_CASE`；页面目录 `kebab-case`。
- 注释使用**中文**。

## 六、Vue SFC 规范

标签顺序**严格固定**：

```vue
<script setup lang="ts">
// 1. definePage 放在最上方
definePage({ style: { navigationBarTitleText: '收支流水' } })
</script>

<template>
  <view class="p-24rpx">
    <!-- 优先使用 UnoCSS 原子类 -->
  </view>
</template>

<style scoped>
/* 推荐使用原子类，尽量不写此块 */
</style>
```

- `<script setup lang="ts">` 第一，`<template>` 第二，`<style scoped>` 最后。
- 一律 Composition API，禁止 Options API。
- 页面标题等配置写在 `definePage` 宏中，**不要手动编辑 `pages.json`**（该文件由构建自动生成）。

## 七、样式规范

- **优先使用 UnoCSS 原子类**，减少自定义 CSS。
- 尺寸单位统一 `rpx`（原子类中写 `p-24rpx`、`text-28rpx` 等形式）。
- 主题色与公共变量在 `uno.config.ts` 中扩展，禁止在页面里散落硬编码色值。
- 确需自定义样式时使用 `<style scoped>`，避免全局污染。

## 八、网络请求（重点）

- **所有请求必须经由 `src/http/` 的封装**，业务代码禁止直接调用 `uni.request`。
- 接口按业务域定义在 `src/api/` 下，页面从 `@/api/xxx` 导入调用，**不要在组件内拼接 URL**。
- 请求拦截器统一注入 `Authorization: Bearer <token>`；响应拦截器统一处理 `401`（清除 token 并跳转登录）与错误提示。
- **后端响应约定**：成功直接返回业务数据本身（不含 `{ code, data }` 包裹）；失败返回 `{ error: '中文错误信息' }` 且 HTTP 状态码非 2xx。封装层需按此约定解析错误文案。
- `baseUrl` 通过环境变量（`.env` 系列文件）配置，**禁止硬编码后端地址**；小程序端注意在微信后台配置服务器域名白名单。

API 定义惯用写法：

```ts
import { http } from '@/http/http'

export interface Transaction {
  id: number
  date: string
  amount: number
  type: 'income' | 'expense'
}

export function getTransactions(params?: { unit?: string; startDate?: string }) {
  return http.get<Transaction[]>('/transactions', params)
}
```

## 九、状态管理

- 使用 Pinia，store 放在 `src/store/`，用 `defineStore` 定义。
- 用户信息与 token 统一由 user store 管理，页面**不要直接读写 storage**。
- 需要持久化的 store 走项目已配置的持久化插件。

## 十、多平台适配

- 平台差异用**条件编译**处理：

```ts
// #ifdef MP-WEIXIN
uni.login({ /* ... */ })
// #endif

// #ifdef H5
// H5 专属逻辑
// #endif
```

- 一律使用 `uni.xxx` API，不要直接用 `wx.xxx` 或浏览器专有 API。
- 新增功能需确认在微信小程序端可用（小程序不支持部分 DOM/BOM 能力）。

## 十一、页面与组件开发

- 新增页面：在 `src/pages/` 建文件，路由自动生成；页面配置写在 `definePage`。
- 全局组件放 `src/components/`（自动按需引入），页面私有组件放该页面同级 `components/`。
- 生命周期：页面用 `onLoad` / `onShow` / `onReady` / `onHide` / `onUnload`；组件用 Vue3 生命周期。
- 列表分页优先复用 `z-paging` 与项目已有 hooks（如 `useScroll`），不要重复造轮子。
- 界面文案一律中文。

## 十二、与后端协作注意事项

1. 接口以 `amiba_digital_assistant` 的 `routes/` 实际实现为准；联调前先确认路径与字段。
2. 后端所有业务数据按登录账号（`owner_id`）隔离，**前端不需要也不应该传递 owner/租户参数**。
3. 若发现前后端字段不一致，优先修正前端类型定义并同步告知后端，不要在页面里做临时字段兼容。
4. token 失效由拦截器统一处理，业务代码不要各自实现登录跳转。

## 十三、修改代码时的注意事项

- 做**最小化增量修改**，不要大规模重构既有文件。
- 不要手改自动生成的文件：`pages.json`、`manifest.json`、`dist/`。
- 新增依赖用 pnpm，并确认其支持小程序平台。
- 提交前确保 lint 通过、TypeScript 无类型错误、微信小程序端可正常编译运行。

# QuoteCraft

这是一个基于 `Next.js App Router + Supabase SSR Auth + React Query + Zustand` 的报价方案系统，当前已经具备 Web 端主链路，并预留了 Capacitor 移动端壳接入结构。

## 当前技术栈

- 前端：Next.js 15、React 19、Tailwind CSS
- 状态管理：Zustand、TanStack Query
- 鉴权与数据：Supabase SSR Auth、Supabase Database
- AI：OpenAI Responses API
- 移动端壳：Capacitor 7

## 当前已具备的能力

- 邮箱 OTP 登录
- 工作台项目列表
- 新建 / 编辑 / 保存项目
- 分享页与打印页
- AI 生成项目简介与服务范围
- Supabase 真是数据读写链路
- Capacitor 远程站点壳基础配置

## 本地开发

先补齐环境变量，再启动开发服务：

```bash
cmd /c npm run dev
```

详细说明见 [LOCAL_SETUP.md](/g:/QuoteCraft/LOCAL_SETUP.md)。

## Capacitor 接入说明

当前项目依赖：

- `app/api/*` 服务端路由
- `server/*` 服务端逻辑
- Supabase SSR Cookie 鉴权

因此不适合直接做纯静态导出 App。当前推荐方案是：

1. 先部署 Web 正式站点
2. 用 Capacitor 将正式站点包成 Android / iOS 外壳
3. 后续若需要更深原生能力，再逐步接入插件

移动端接入与打包步骤见 [CAPACITOR_SETUP.md](/g:/QuoteCraft/CAPACITOR_SETUP.md)。

Android 打包流程见 [ANDROID_RELEASE.md](/g:/QuoteCraft/ANDROID_RELEASE.md)。

Android 上架前检查见 [ANDROID_PUBLISH_CHECKLIST.md](/g:/QuoteCraft/ANDROID_PUBLISH_CHECKLIST.md)。

Google Play 上架步骤见 [ANDROID_GOOGLE_PLAY_PUBLISH.md](/g:/QuoteCraft/ANDROID_GOOGLE_PLAY_PUBLISH.md)。

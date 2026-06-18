# QuoteCraft App 前后端技术方案

## 1. 方案结论

针对当前 App 原型和现有 PRD，最合适的方案不是原生 App，也不是前后端完全拆分的大系统，而是：

- 前端采用 `Next.js + TypeScript` 构建一套 **移动端优先的 Web App / PWA**
- 后端采用 `Next.js BFF + Supabase`
- AI 能力通过服务端统一转发到模型接口
- 分享页使用公开只读路由
- PDF 导出优先采用 **服务端生成 PDF**，而不是完全依赖浏览器打印

这个方案最适合当前阶段，原因很直接：

1. 产品还在 MVP 验证期，首要目标是快速上线、快速迭代、快速验证付费，而不是追求原生性能
2. 用户场景天然偏微信、浏览器、分享链接，不适合一开始就投入 React Native / Flutter
3. PRD 已经明确 MVP 聚焦登录、项目、报价、分享、AI、PDF，这些能力都非常适合由 Next.js 一体化交付
4. App 原型更像“移动端工作台”，本质上是高频表单、状态同步、文档预览和分享系统，Web 技术栈足够胜任

---

## 2. 为什么不推荐原生 App

当前阶段不建议直接做 iOS / Android 原生或跨端原生框架，原因如下：

1. 分享页是核心能力，天然就是 Web 路由
2. PDF、打印、公开链接预览这些能力本来就更适合 Web
3. 业务核心不是设备能力调用，而是表单编辑、模板渲染、AI 文案和分享
4. MVP 阶段功能经常变化，Web 迭代速度和发版成本更优
5. 用户大概率通过微信、浏览器或电脑继续修改方案，不是纯 App 闭环

结论：**先做 PWA 型移动 Web App，等验证完成后再决定是否壳化或做原生。**

---

## 3. 前端方案

参考页面主要来自 [app-prototype.html](/g:/QuoteCraft/app-prototype.html:718) 到 [app-prototype.html](/g:/QuoteCraft/app-prototype.html:966)，核心包含：

- 登录
- 项目工作台
- 报价编辑
- 客户分享页

### 3.1 推荐技术栈

- `Next.js 15` + App Router
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui` + `Radix UI`
- `React Hook Form`
- `Zod`
- `Zustand`
- `TanStack Query`
- `Framer Motion` 可选，仅用于少量页面切换和卡片反馈

### 3.2 为什么这样选

`Next.js`

- 既能做移动端页面，也能做公开分享页
- 同时支持服务端渲染、路由、BFF API 和鉴权中间层
- 后续接入管理后台也能继续复用同一代码库

`React Hook Form + Zod`

- App 的核心是表单录入和报价编辑
- 字段较多，且需要实时校验、默认值、脏状态和自动保存
- 很适合处理 PRD 中的项目字段和报价项字段

`Zustand`

- 最适合编辑器本地草稿态
- 可以把“基本信息 / 项目说明 / 报价项 / 模板选择 / 预览态”放在一份轻量状态树里
- 实时预览、金额计算、自动保存都更顺手

`TanStack Query`

- 负责服务端数据缓存，如项目列表、项目详情、分享链接、AI 请求结果
- 避免把“远程状态”和“本地编辑态”混在一起

### 3.3 前端分层建议

建议拆成这几层：

1. `app/`
   - 页面路由
2. `features/`
   - 登录
   - 项目工作台
   - 报价编辑器
   - 分享页
   - AI 辅助
3. `entities/`
   - project
   - quote-item
   - user
4. `shared/`
   - UI 组件
   - hooks
   - utils
   - 常量

### 3.4 页面路由建议

```text
/login
/workspace
/projects/new
/projects/[id]
/share/[token]
/settings/billing
```

如果后续与后台合并在一个仓库，可继续扩展：

```text
/admin
/admin/projects
/admin/templates
/admin/billing
```

### 3.5 组件结构建议

报价编辑页建议拆成：

- `ProjectBasicForm`
- `ProjectSummaryForm`
- `QuoteItemList`
- `QuoteItemRow`
- `TemplateSelector`
- `AiAssistSheet`
- `MobilePreviewCard`
- `ShareDocumentView`

这样后面无论是移动端编辑页还是桌面端预览页，都可以复用文档组件。

### 3.6 状态管理建议

本地编辑状态：

- `Zustand` 管理
- 内容包括：
  - 项目基础信息
  - 报价项数组
  - 当前模板
  - 自动保存状态
  - 本地总价

远程状态：

- `TanStack Query`
- 内容包括：
  - 项目列表
  - 项目详情加载
  - 分享链接生成
  - AI 生成请求
  - 登录态相关读取

### 3.7 实时预览实现

PRD 在 [报价方案助手-完整设计文档.md](/g:/QuoteCraft/报价方案助手-完整设计文档.md:845) 到 [报价方案助手-完整设计文档.md](/g:/QuoteCraft/报价方案助手-完整设计文档.md:888) 已经建议“编辑区与预览区读取同一份状态”。

前端实现建议：

1. 表单输入写入 Zustand
2. 预览组件直接订阅 Zustand
3. 金额在前端实时计算
4. 自动保存采用 debounce，300ms 到 800ms 一次

---

## 4. 后端方案

### 4.1 推荐技术栈

- `Next.js Route Handlers`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage` 可选
- `OpenAI API` 或兼容模型接口
- `Upstash Redis` 可选，用于 AI 和分享接口限流

### 4.2 为什么选 BFF 架构

最合适的后端形态不是独立 Java / Nest 大后端，而是：

- 前端页面和 API 在一个 Next.js 仓库里
- Next.js 作为 BFF 处理鉴权、聚合和 AI 转发
- Supabase 提供用户、数据库和行级安全

优点：

1. 开发速度快
2. 部署和环境管理简单
3. 前后端改动可以一起发版
4. 分享页、AI、项目接口都能在同一层统一收口

### 4.3 后端职责边界

前端负责：

- 表单交互
- 本地金额计算
- 实时预览
- 自动保存触发

后端负责：

- 登录鉴权
- 项目读写
- 分享 token 创建与查询
- AI Prompt 拼装与调用
- PDF 生成
- 权限校验和限流

### 4.4 API 设计建议

核心接口保持和 PRD 一致，但建议补成以下形态：

```text
POST   /api/auth/login
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/duplicate
POST   /api/projects/:id/share
GET    /api/share/:token
POST   /api/ai/generate-summary
POST   /api/ai/generate-scope
POST   /api/projects/:id/export-pdf
```

### 4.5 数据库建议

PRD 里的表已经够用，建议在此基础上补以下字段：

`projects`

- `industry`：客户行业，便于 AI 生成
- `raw_requirement`：原始需求文本
- `version`：乐观锁版本号
- `last_exported_at`
- `last_shared_at`

`quote_items`

- `category`：如设计 / 开发 / 运维
- `is_preset`：是否来源于系统预设项

新增建议表：

`share_visits`

- `id`
- `project_id`
- `share_token`
- `visited_at`
- `user_agent`
- `ip_hash`

`ai_logs`

- `id`
- `user_id`
- `project_id`
- `action`
- `input_snapshot`
- `output_text`
- `created_at`

---

## 5. 鉴权与安全

PRD 在 [报价方案助手-完整设计文档.md](/g:/QuoteCraft/报价方案助手-完整设计文档.md:889) 已经给出基础方向，这里建议具体化。

### 5.1 登录方案

- `Supabase Auth` 邮箱 Magic Link / OTP
- App 端使用无密码登录
- 登录成功后跳转 `/workspace`

### 5.2 权限模型

- 登录用户只能读写自己的项目
- `share/[token]` 只读公开访问
- 所有写接口必须校验 `user_id`
- 分享页绝不复用编辑接口

### 5.3 数据安全

- 开启 Supabase RLS
- `projects.user_id = auth.uid()`
- `quote_items.project_id` 必须属于当前用户项目
- 分享 token 使用高熵随机字符串
- AI 接口按用户和 IP 限流
- 对输入字段长度做服务端二次校验

---

## 6. PDF 与分享页技术方案

这是本方案里最值得调整的一点。

PRD 首版建议浏览器打印导出 PDF，这对桌面 Web 没问题，但对 App 原型不够友好，因为移动端打印体验不稳定。

### 6.1 推荐做法

采用 **统一 HTML 模板 + 服务端 PDF 生成**：

1. 前端和分享页共用一套文档模板组件
2. 服务端生成同结构的 HTML
3. 用无头浏览器生成 A4 PDF

推荐实现：

- `Playwright` 或 `Puppeteer`
- 在服务端渲染分享文档模板
- 使用统一 print CSS

### 6.2 这样做的好处

1. PDF 样式更稳定
2. 移动端也能一键下载
3. 不依赖用户设备打印能力
4. 分享页和 PDF 输出一致，不会两套样式分叉

结论：

- 如果只看 PRD 首版，浏览器打印是最快
- 如果结合当前 App 原型，**服务端 PDF 更合适**

---

## 7. AI 技术方案

### 7.1 调用方式

- 前端只传结构化数据
- 后端统一组装 Prompt
- 后端调用 OpenAI API
- 后端统一限制长度、风格和风险语句

### 7.2 为什么不要前端直连模型

1. API Key 不安全
2. Prompt 无法统一管控
3. 无法做限流和成本控制
4. 无法记录 AI 使用日志

### 7.3 建议的输入结构

```json
{
  "projectType": "website",
  "industry": "education",
  "features": ["首页", "课程展示", "报名表单"],
  "rawRequirement": "客户需要一个教育品牌官网",
  "tone": "professional_business"
}
```

### 7.4 建议的输出规则

- 不承诺不可控结果
- 不虚构未报价能力
- 默认 120 到 220 字
- 允许用户二次编辑

---

## 8. 部署方案

### 8.1 推荐部署

- 前端 + BFF：`Vercel`
- 数据库 + Auth：`Supabase`
- Redis 限流：`Upstash`
- 域名：
  - `app.xxx.com` 用于业务端
  - `share.xxx.com` 可选，用于客户分享页

### 8.2 环境划分

- `local`
- `preview`
- `production`

### 8.3 CI/CD

- GitHub + Vercel Preview Deployments
- 每个 PR 自动生成预览地址
- 核心接口变更时跑：
  - 类型检查
  - lint
  - 单元测试
  - 关键 Playwright 流程测试

---

## 9. 最适合当前阶段的开发切法

### Phase 1

- 登录
- 工作台
- 项目创建
- 报价项增删改
- 实时总价
- 公开分享页

### Phase 2

- 自动保存
- AI 项目简介
- AI 服务范围
- 服务端 PDF

### Phase 3

- 免费版限制
- 项目复制
- 分享访问记录
- 付费升级引导

---

## 10. 最终推荐

如果只给一句结论：

**最合适的技术方案是：用 `Next.js + TypeScript + Tailwind + React Hook Form + Zustand + TanStack Query` 做移动端优先 Web App，用 `Next.js BFF + Supabase + OpenAI API` 做后端，分享页走公开只读路由，PDF 采用服务端生成。**

这比“原生 App + 独立后端”更适合现在的 QuoteCraft，因为它更快、更稳、更贴合报价分享场景，也更符合这份 PRD 的 MVP 验证目标。

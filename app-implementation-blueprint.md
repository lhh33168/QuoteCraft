# QuoteCraft App 实现蓝图

## 1. 目标

这份蓝图用于把 [app-prototype.html](/g:/QuoteCraft/app-prototype.html) 和 [报价方案助手-完整设计文档.md](/g:/QuoteCraft/报价方案助手-完整设计文档.md) 转成第一版可开发工程。

范围只覆盖 App 端 MVP，不包含完整后台管理系统。

首版目标：

1. 完成邮箱登录闭环
2. 完成项目工作台
3. 完成项目创建与报价编辑
4. 完成分享页
5. 完成 AI 项目简介 / 服务范围辅助
6. 完成 PDF 导出

---

## 2. 建议项目结构

```text
quotecraft-app/
├─ app/
│  ├─ (auth)/
│  │  └─ login/page.tsx
│  ├─ (app)/
│  │  ├─ workspace/page.tsx
│  │  ├─ projects/new/page.tsx
│  │  ├─ projects/[id]/page.tsx
│  │  └─ settings/billing/page.tsx
│  ├─ share/[token]/page.tsx
│  ├─ api/
│  │  ├─ auth/login/route.ts
│  │  ├─ projects/route.ts
│  │  ├─ projects/[id]/route.ts
│  │  ├─ projects/[id]/duplicate/route.ts
│  │  ├─ projects/[id]/share/route.ts
│  │  ├─ projects/[id]/export-pdf/route.ts
│  │  ├─ share/[token]/route.ts
│  │  └─ ai/
│  │     ├─ generate-summary/route.ts
│  │     └─ generate-scope/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ features/
│  ├─ auth/
│  ├─ workspace/
│  ├─ project-editor/
│  ├─ quote-items/
│  ├─ share-document/
│  ├─ ai-assist/
│  └─ pdf-export/
├─ entities/
│  ├─ project/
│  ├─ quote-item/
│  └─ user/
├─ shared/
│  ├─ ui/
│  ├─ hooks/
│  ├─ lib/
│  ├─ config/
│  ├─ constants/
│  └─ types/
├─ server/
│  ├─ auth/
│  ├─ db/
│  ├─ repositories/
│  ├─ services/
│  ├─ ai/
│  └─ pdf/
├─ supabase/
│  ├─ migrations/
│  ├─ policies/
│  └─ seed.sql
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
└─ package.json
```

---

## 3. 页面与模块映射

### 3.1 登录页

原型参考：

- [app-prototype.html](/g:/QuoteCraft/app-prototype.html:718)

路由：

- `/login`

模块：

- `features/auth/components/LoginHero`
- `features/auth/components/MagicLinkForm`

功能：

1. 输入邮箱
2. 发送 Magic Link / OTP
3. 登录成功后跳转 `/workspace`

---

### 3.2 工作台

原型参考：

- [app-prototype.html](/g:/QuoteCraft/app-prototype.html:761)

路由：

- `/workspace`

模块：

- `features/workspace/components/WorkspaceHeader`
- `features/workspace/components/ProjectList`
- `features/workspace/components/QuickActions`
- `features/workspace/components/WorkspaceStats`

功能：

1. 展示用户项目列表
2. 支持新建项目
3. 支持继续编辑
4. 支持跳转分享页
5. 支持搜索项目

---

### 3.3 项目编辑页

原型参考：

- [app-prototype.html](/g:/QuoteCraft/app-prototype.html:822)

路由：

- `/projects/new`
- `/projects/[id]`

模块：

- `features/project-editor/components/ProjectEditorPage`
- `features/project-editor/components/ProjectBasicForm`
- `features/project-editor/components/ProjectContentForm`
- `features/quote-items/components/QuoteItemList`
- `features/quote-items/components/QuoteItemRow`
- `features/project-editor/components/ProjectSummaryCard`
- `features/ai-assist/components/AiAssistActions`
- `features/share-document/components/MobilePreviewCard`

功能：

1. 项目基础信息编辑
2. 项目简介 / 背景 / 目标 / 服务范围编辑
3. 报价项增删改
4. 总价实时计算
5. 自动保存
6. 生成分享页
7. 导出 PDF
8. AI 生成文案

---

### 3.4 分享页

原型参考：

- [app-prototype.html](/g:/QuoteCraft/app-prototype.html:902)

路由：

- `/share/[token]`

模块：

- `features/share-document/components/ShareDocumentPage`
- `features/share-document/components/ShareHeader`
- `features/share-document/components/ScopeSection`
- `features/share-document/components/QuoteSection`
- `features/share-document/components/DeliverySection`

功能：

1. 公开只读访问
2. 展示项目简介
3. 展示服务范围
4. 展示报价明细
5. 展示总金额
6. 展示工期与交付

---

## 4. 领域模型建议

### 4.1 Project

```ts
type Project = {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  clientCompany: string | null;
  projectType: "website" | "mini_program" | "admin_panel" | "custom";
  industry: string | null;
  contactName: string | null;
  contactPhone: string | null;
  summary: string | null;
  background: string | null;
  goal: string | null;
  scope: string | null;
  rawRequirement: string | null;
  duration: string | null;
  deliveryNote: string | null;
  remark: string | null;
  templateType: "simple" | "full";
  totalPrice: string;
  status: "draft" | "generated" | "shared";
  shareToken: string | null;
  lastExportedAt: string | null;
  lastSharedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};
```

### 4.2 QuoteItem

```ts
type QuoteItem = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  category: "design" | "frontend" | "backend" | "testing" | "ops" | "other";
  unitPrice: string;
  quantity: number;
  unit: string | null;
  subtotal: string;
  sortOrder: number;
  isPreset: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

## 5. 前端状态设计

### 5.1 Query Key 设计

```ts
const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  share: (token: string) => ["share", token] as const,
};
```

### 5.2 编辑器 Store 设计

```ts
type ProjectEditorStore = {
  project: Partial<Project>;
  quoteItems: QuoteItemDraft[];
  dirty: boolean;
  saving: boolean;
  templateType: "simple" | "full";
  setField: (key: string, value: unknown) => void;
  setQuoteItems: (items: QuoteItemDraft[]) => void;
  addQuoteItem: () => void;
  removeQuoteItem: (id: string) => void;
  reorderQuoteItems: (from: number, to: number) => void;
  calculateTotal: () => string;
  reset: (payload: ProjectDetailPayload) => void;
};
```

### 5.3 自动保存策略

建议：

1. 用户输入后更新本地 store
2. 300ms 到 800ms debounce 后触发保存
3. 保存时只传脏字段和完整报价项快照
4. 返回 `updatedAt` 和 `version`
5. 如果版本冲突，提示“已有新版本，请刷新”

---

## 6. API 请求与返回约定

### 6.1 列表接口

`GET /api/projects`

响应：

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "教育品牌官网升级",
      "clientName": "清林教育",
      "projectType": "website",
      "totalPrice": "38000.00",
      "status": "generated",
      "updatedAt": "2026-06-18T10:00:00Z"
    }
  ]
}
```

### 6.2 项目详情接口

`GET /api/projects/:id`

响应：

```json
{
  "project": {},
  "quoteItems": []
}
```

### 6.3 项目保存接口

`PUT /api/projects/:id`

请求：

```json
{
  "project": {
    "title": "教育品牌官网升级",
    "summary": "..."
  },
  "quoteItems": [],
  "version": 3
}
```

### 6.4 分享接口

`POST /api/projects/:id/share`

响应：

```json
{
  "shareToken": "abcdef123456",
  "shareUrl": "https://app.example.com/share/abcdef123456"
}
```

### 6.5 AI 文案接口

`POST /api/ai/generate-summary`
`POST /api/ai/generate-scope`

请求：

```json
{
  "projectType": "website",
  "industry": "education",
  "features": ["首页", "课程展示", "报名表单"],
  "rawRequirement": "客户需要一个品牌官网"
}
```

---

## 7. 服务端模块划分

### 7.1 repository 层

- `projectRepository`
- `quoteItemRepository`
- `shareRepository`
- `aiLogRepository`

职责：

- 只做数据库读写
- 不做业务判断

### 7.2 service 层

- `projectService`
- `shareService`
- `aiService`
- `pdfService`

职责：

- 校验业务规则
- 协调多表读写
- 生成 share token
- 拼装 AI Prompt
- 生成 PDF

### 7.3 auth 层

- `requireUser()`
- `getOptionalUser()`
- `assertProjectOwner(projectId, userId)`

---

## 8. 关键业务规则

### 8.1 报价项计算

规则：

1. `subtotal = unitPrice * quantity`
2. `totalPrice = sum(subtotal)`
3. 所有金额统一保留 2 位
4. 后端保存前再次重算，不信任前端传入 subtotal

### 8.2 项目状态流转

建议规则：

- 默认 `draft`
- 当项目字段齐全且至少 1 个报价项时，可标记为 `generated`
- 生成分享链接后标记为 `shared`

### 8.3 免费版限制

首版判断规则：

1. 免费版最多 3 个项目
2. 免费版不允许调用 AI 接口
3. 免费版仅允许 `simple` 模板
4. 免费版导出 PDF 增加水印

---

## 9. 测试清单

### 9.1 单元测试

- 金额计算函数
- 项目状态判断
- 分享 token 生成
- AI prompt 构造

### 9.2 集成测试

- 创建项目
- 更新项目
- 复制项目
- 生成分享链接
- 获取分享页内容

### 9.3 E2E

1. 登录
2. 新建项目
3. 填写简介
4. 添加报价项
5. 查看总价
6. 生成分享链接
7. 打开分享页
8. 导出 PDF

---

## 10. 第一周开发顺序

### Day 1

- 初始化 Next.js
- 接入 Supabase
- 建立数据库表

### Day 2

- 完成登录页
- 完成登录态守卫
- 完成工作台列表接口

### Day 3

- 完成新建项目
- 完成项目详情查询
- 完成编辑器 store

### Day 4

- 完成报价项增删改
- 完成总价计算
- 完成自动保存

### Day 5

- 完成分享 token
- 完成分享页
- 完成基础 print 样式

### Day 6

- 完成 AI 项目简介
- 完成 AI 服务范围
- 加入限流

### Day 7

- 补测试
- 修移动端交互
- 处理错误提示和边界情况

---

## 11. 下一步建议

如果继续往下做，最合理的顺序是：

1. 先生成 Next.js 项目骨架
2. 再落 Supabase migration
3. 再接登录和项目列表
4. 然后做编辑器和分享页

这样能最快把这套原型变成真正可跑的 MVP。

# QuoteCraft 本地联调说明

当前项目的登录、报价、订阅与升级审批，已经按现在这版代码打通到可联调状态。

## 1. 环境变量

在项目根目录创建 `.env.local`，至少补齐下面这些值：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
NEXT_PUBLIC_CAPACITOR_SERVER_URL=
ADMIN_EMAILS=
```

说明：

- 浏览器端至少需要 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 服务端建议优先配置 `SUPABASE_SECRET_KEY`
- 如果没有 `SUPABASE_SECRET_KEY`，再使用 `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` 未配置时，AI 能力会退回本地兜底文案
- `NEXT_PUBLIC_CAPACITOR_SERVER_URL` 用于 Capacitor App 连接线上地址
- `ADMIN_EMAILS` 用逗号分隔多个管理员邮箱，例如：

```env
ADMIN_EMAILS=admin@quotecraft.cn,owner@quotecraft.cn
```

只有出现在 `ADMIN_EMAILS` 里的邮箱，登录后才能访问订阅审批页。

## 2. Supabase 初始化

在 Supabase 控制台的 `SQL Editor` 执行：

- [supabase-schema-and-rls.sql](/abs/path/G:/QuoteCraft/supabase-schema-and-rls.sql)

这一步现在除了项目表，还包含：

- `user_profiles` 的订阅字段
- `subscription_upgrade_requests` 升级申请表
- 对应的 RLS 和授权策略

如果没有重新执行这份 SQL，订阅与审批功能不会完整生效。

## 3. 邮箱登录模板

建议在 `Auth -> Email Templates -> Magic Link or OTP` 中使用验证码模板，不要把主流程建立在邮件回跳上。

推荐模板：

```html
<h2>QuoteCraft 邮箱验证码</h2>
<p>你的登录验证码是：<strong>{{ .Token }}</strong></p>
<p>这是 8 位数字验证码，请回到 QuoteCraft 登录页输入。</p>
```

当前主登录流程是：

1. 输入邮箱
2. 收到验证码
3. 在当前登录页输入验证码
4. 完成登录

## 4. 本地启动

如果 PowerShell 遇到 `npm.ps1` 执行策略问题，使用：

```bash
cmd /c npm run dev
```

启动后访问：

```text
http://localhost:3000
```

## 5. 健康检查

访问：

```text
http://localhost:3000/api/health
```

重点确认：

- `health.supabase.hasUrl`
- `health.supabase.hasPublishableKey`
- `health.supabase.hasServerKey`
- `health.supabase.browserConfigured`
- `health.supabase.serverConfigured`

## 6. 会话检查

登录成功后访问：

```text
http://localhost:3000/api/auth/session
```

重点确认：

- `auth.hasSupabaseAuthCookie`
- `auth.session.exists`
- `auth.user.exists`
- `auth.claims.email`

## 7. 订阅与审批联调

普通用户流程：

1. 登录
2. 进入 `/settings/billing`
3. 提交升级申请

管理员流程：

1. 确保登录邮箱已经写入 `ADMIN_EMAILS`
2. 登录后进入 `/settings/billing`
3. 页面会显示“进入审批页”入口
4. 或直接访问 `/settings/billing/admin`
5. 对升级申请执行“通过”或“拒绝”

审批通过后会自动：

- 将用户套餐切换为 `pro`
- 把 `project_limit` 改为不限
- 把 `ai_monthly_limit` 改为不限

## 8. 当前订阅规则

免费版：

- 最多 `3` 个项目
- 每月 `10` 次 AI 生成
- 支持客户分享链接
- 支持导出 PDF

专业版：

- 项目数量不限
- AI 生成不限量
- 支持客户分享链接
- 支持导出 PDF

## 9. 目前已接入限制的入口

已经接入服务端权益校验的入口：

- 新建项目
- 复制项目
- AI 生成项目简介
- AI 生成服务范围

也就是说，即使前端被绕过，服务端也会拦住超额使用。

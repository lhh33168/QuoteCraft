# QuoteCraft 本地联调说明

当前这版代码已经把登录、项目、订阅、升级申请、管理员审核、分享与导出主链路接通到可联调状态。

## 1. 环境变量

在项目根目录创建 `.env.local`，至少补齐这些值：

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
- `ADMIN_EMAILS` 使用英文逗号分隔多个管理员邮箱，例如：

```env
ADMIN_EMAILS=admin@quotecraft.cn,owner@quotecraft.cn
```

只有出现在 `ADMIN_EMAILS` 里的邮箱，登录后才能访问订阅审核页。

## 2. Supabase 初始化

在 Supabase 控制台的 `SQL Editor` 中执行：

- [supabase-schema-and-rls.sql](/abs/path/G:/QuoteCraft/supabase-schema-and-rls.sql)

这一步除了项目表，还包含：

- `user_profiles` 订阅字段
- `subscription_upgrade_requests` 升级申请表
- `subscription_orders` 付款登记表
- 对应的 RLS 和授权策略

如果没有重新执行这份 SQL，订阅、升级、审核、付款登记相关功能都可能不完整生效。

## 3. 如何判断订阅表还没同步好

如果你现在打开 `/workspace`：

- 项目列表能正常显示
- 但顶部出现“订阅信息暂时加载失败，但你仍可以正常查看项目列表”

通常说明：

1. `user_profiles` 缺少新字段
2. `subscription_upgrade_requests` 或 `subscription_orders` 还没建
3. RLS / GRANT 没重新生效

这时优先重新执行一次：

- [supabase-schema-and-rls.sql](/abs/path/G:/QuoteCraft/supabase-schema-and-rls.sql)

## 4. 邮箱登录模板

建议在 `Auth -> Email Templates -> Magic Link or OTP` 中使用验证码模板，不要把主流程建立在邮箱回跳上。

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

补充：

- 现在 `/api/auth/verify` 已增加验证限流冷却
- 如果短时间内多次输错验证码，会提示稍后再试，并显示倒计时

## 5. 本地启动

如果 PowerShell 遇到 `npm.ps1` 执行策略问题，使用：

```bash
cmd /c npm run dev
```

启动后访问：

```text
http://localhost:3000
```

## 6. 健康检查

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

## 7. 会话检查

登录成功后访问：

```text
http://localhost:3000/api/auth/session
```

重点确认：

- `auth.hasSupabaseAuthCookie`
- `auth.session.exists`
- `auth.user.exists`
- `auth.claims.email`

## 8. 订阅与审核联调

普通用户流程：

1. 登录
2. 进入 `/settings/billing`
3. 提交升级申请或付款登记

管理员流程：

1. 确保登录邮箱已写入 `ADMIN_EMAILS`
2. 登录后进入 `/settings/billing`
3. 页面会显示“进入审核页”入口
4. 或直接访问 `/settings/billing/admin`
5. 审核升级申请或付款登记

审核通过后会自动：

- 将用户套餐切换为 `pro`
- 将项目额度改为不限
- 将 AI 月额度改为不限

## 9. 当前订阅规则

免费版：

- 最多 `3` 个项目
- 每月 `10` 次 AI 生成
- 支持客户分享链接
- 支持导出 PDF

专业版：

- 项目数量不限
- AI 生成不限
- 支持客户分享链接
- 支持导出 PDF

## 10. 当前已接入服务端限制的入口

已经接入服务端权益校验的入口：

- 新建项目
- 复制项目
- AI 生成项目简介
- AI 生成服务范围
- 生成分享链接
- 打开打印 / PDF 导出
- 分享页里的 PDF 导出

也就是说，即使前端被绕过，服务端也会拦住超额或无权限使用。

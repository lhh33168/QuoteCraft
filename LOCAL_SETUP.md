# QuoteCraft 本地联调说明

## 1. 当前状态

当前工程已经通过：

- `cmd /c npm run typecheck`
- `cmd /c npm run build`

说明项目骨架、类型检查和生产构建都已经可用，接下来可以重点做本地联调。

## 2. 启动前准备

在项目根目录创建 `.env.local`，至少准备这些变量：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

说明：

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 优先级高于 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 服务端读写数据库建议配置 `SUPABASE_SECRET_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` 未配置时，AI 生成功能会走本地 fallback 文案

## 3. Supabase 初始化

### 3.1 创建项目

先在 Supabase 控制台创建一个新项目。

### 3.2 执行 SQL

把下面文件里的内容执行到 Supabase 的 `SQL Editor`：

- [supabase-schema-and-rls.sql](/g:/QuoteCraft/supabase-schema-and-rls.sql)

### 3.3 配置 Auth 跳转地址

在 Supabase Auth 配置里确认：

- `Site URL` 为 `http://localhost:3000`
- `Redirect URL` 包含 `http://localhost:3000/auth/callback`

如果后面要接预发环境，也要把对应域名一并加入白名单。

### 3.4 配置邮箱验证码模板

当前项目使用的是邮箱 OTP 验证码登录，不再依赖 Magic Link 点击跳转。

请在 Supabase 控制台中进入：

- `Auth`
- `Email Templates`
- `Magic Link`

将邮件模板改成使用 `{{ .Token }}`，不要使用 `{{ .ConfirmationURL }}`。

推荐模板：

```html
<h2>QuoteCraft 邮箱验证码</h2>
<p>你的登录验证码是：{{ .Token }}</p>
<p>验证码 60 分钟内有效，请勿泄露给他人。</p>
```

当前实际验证码长度为 `8` 位数字。

## 4. 启动项目

如果 PowerShell 遇到 `npm.ps1` 执行策略问题，直接使用：

```bash
cmd /c npm run dev
```

启动后访问：

```text
http://localhost:3000
```

如果你刚改过 `.env.local`，记得重启本地开发服务。

## 5. 环境自检

项目内已经提供了运行状态检查接口：

```text
GET /api/health
```

本地地址：

```text
http://localhost:3000/api/health
```

你会看到类似结果：

```json
{
  "ok": true,
  "timestamp": "2026-06-18T00:00:00.000Z",
  "health": {
    "app": {
      "nodeEnv": "development",
      "hasNodeModules": true
    },
    "supabase": {
      "hasUrl": true,
      "hasPublishableKey": true,
      "hasServerKey": true,
      "browserConfigured": true,
      "serverConfigured": true
    },
    "openai": {
      "hasApiKey": true,
      "model": "gpt-5.5"
    }
  }
}
```

重点关注：

- `supabase.browserConfigured`
- `supabase.serverConfigured`
- `openai.hasApiKey`

## 6. 登录态排查

如果访问 `/workspace` 时出现：

```text
307 Temporary Redirect
Location: /login?next=%2Fworkspace
```

这通常说明中间件判断当前浏览器还没有有效登录态。

### 6.1 调试接口

可以直接访问：

```text
http://localhost:3000/api/auth/session
```

这个接口会返回服务端当前看到的：

- 是否检测到 `sb-...-auth-token` Cookie
- 是否能读到 Supabase session
- 是否能读到 user
- 是否能读到 claims

示例结果：

```json
{
  "ok": true,
  "auth": {
    "browserConfigured": true,
    "hasSupabaseAuthCookie": true,
    "authCookieNames": ["sb-xxxx-auth-token"],
    "session": {
      "exists": true
    },
    "user": {
      "exists": true,
      "id": "xxxx",
      "email": "demo@example.com"
    },
    "claims": {
      "sub": "xxxx",
      "email": "demo@example.com"
    }
  },
  "errors": []
}
```

### 6.2 如何判断问题位置

如果 `/api/auth/session` 返回：

- `hasSupabaseAuthCookie = false`
  说明浏览器还没有写入登录 Cookie，优先检查验证码校验是否成功完成
- `hasSupabaseAuthCookie = true` 但 `session.exists = false`
  说明 Cookie 已存在，但服务端没换出有效 session，优先检查 `/api/auth/verify` 流程
- `session.exists = true` 但 `/workspace` 仍被踢回 `/login`
  说明要继续检查 `middleware` 中的鉴权判断

### 6.3 推荐排查顺序

1. 先打开 `/api/health`，确认环境变量状态正常
2. 打开 `/login`
3. 输入邮箱并发送验证码
4. 在邮箱中查看 8 位数字验证码
5. 回到 `/login` 完成验证码校验
6. 访问 `/api/auth/session`
7. 最后访问 `/workspace`

## 7. 联调顺序建议

建议按这个顺序联调：

1. 打开 `/api/health`，确认环境变量正常
2. 完成邮箱验证码登录闭环
3. 用 `/api/auth/session` 确认服务端已经拿到 session
4. 打开 `/workspace`
5. 创建一个新项目
6. 在编辑页测试手动保存和自动保存
7. 测试 AI 生成项目简介和服务范围
8. 打开分享页 `/share/[token]`

## 8. 常见问题

### 8.1 `npm.ps1` 被执行策略拦截

现象：

```text
无法加载文件 npm.ps1，因为在此系统上禁止运行脚本
```

解决：

```bash
cmd /c npm run dev
```

### 8.2 登录页能打开，但邮件发送失败

优先检查：

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Supabase 的邮箱认证能力是否已开启
4. `Magic Link` 邮件模板是否已改成 `{{ .Token }}`
5. `Redirect URL` 是否包含 `/auth/callback`

如果接口返回 `email rate limit exceeded`：

1. 这说明 Supabase 暂时限制了当前邮箱的发送频率，不是代码损坏
2. 先等待 60 秒后重试
3. 或直接换一个新邮箱继续联调

### 8.3 收到的是登录链接，不是验证码

优先检查：

1. 当前本地 `.env.local` 指向的 Supabase 项目是否正确
2. 你修改模板的项目，是否和 `NEXT_PUBLIC_SUPABASE_URL` 对应的是同一个项目
3. 你修改的是否是 `Auth -> Email Templates -> Magic Link`
4. 模板里是否仍然保留了 `{{ .ConfirmationURL }}`

只要邮件模板里保留链接变量，Supabase 发送的就仍然会是登录链接邮件。

### 8.4 输入验证码后仍无法登录

优先检查：

1. 邮件里的验证码是否为最新一封
2. 当前验证码是否为 8 位数字
3. `/api/auth/verify` 返回的具体错误
4. `/api/auth/session` 是否已经能看到 `session.exists = true`

### 8.5 工作台或项目详情仍显示 mock 数据

优先检查：

1. `SUPABASE_SECRET_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY` 是否已配置
2. 数据库是否已经执行 SQL
3. `projects`、`quote_items` 等表里是否已有数据

### 8.6 报错 `permission denied for table projects`

这通常不是前端问题，而是 Supabase 数据库权限没有放开。

解决方式：

1. 打开 Supabase `SQL Editor`
2. 重新执行 [supabase-schema-and-rls.sql](/g:/QuoteCraft/supabase-schema-and-rls.sql)
3. 确认其中的 `GRANT` 段已经成功执行
4. 重启本地服务后再测试

如果你之前只执行过建表和 RLS，但没有执行授权语句，就会出现：

- 能登录
- 能进入页面
- 但读取 `projects` 或创建项目时报 `permission denied`

### 8.7 AI 按钮能点，但结果像模板文案

这通常说明当前走的是 fallback。

优先检查：

1. `OPENAI_API_KEY` 是否已配置
2. 当前网络是否能访问 OpenAI API
3. `OPENAI_MODEL` 是否填写为可用模型名

## 9. 下一步建议

当前最值得优先完成的是：

1. 跑通 Supabase session 登录闭环
2. 验证 `/workspace`、项目保存、自动保存都走真实用户数据
3. 再继续做 AI、分享页和导出能力的联调

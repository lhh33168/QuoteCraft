# QuoteCraft 本地联调说明

## 1. 当前状态

当前工程已经通过：

- `cmd /c npm run typecheck`
- `cmd /c npm run build`

说明项目骨架、类型检查和生产构建都已经可用，接下来可以重点做本地联调。

---

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

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 会优先于 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 服务端读写数据库建议配置 `SUPABASE_SECRET_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` 不填时，AI 生成功能会走本地 fallback 文案

---

## 3. Supabase 初始化

### 3.1 创建项目

先在 Supabase 控制台创建一个新项目。

### 3.2 执行 SQL

把下面文件里的内容执行到 Supabase 的 SQL Editor：

- [supabase-schema-and-rls.sql](/g:/QuoteCraft/supabase-schema-and-rls.sql)

### 3.3 配置 Auth 跳转地址

在 Supabase Auth 配置里确认：

- `Site URL` 为 `http://localhost:3000`
- `Redirect URL` 包含 `http://localhost:3000/auth/callback`

如果后面要接预发环境，也要把对应域名一并加入白名单。

---

## 4. 启动项目

如果 PowerShell 遇到 `npm.ps1` 执行策略问题，直接用：

```bash
cmd /c npm run dev
```

启动后访问：

```text
http://localhost:3000
```

---

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

---

## 6. 登录态排查

如果访问 `/workspace` 时出现：

```text
307 Temporary Redirect
Location: /login?next=%2Fworkspace
```

这通常说明中间件判断当前浏览器还没有有效登录态。

### 6.1 新增调试接口

现在可以直接访问：

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

### 6.2 如何判断问题在哪

如果 `/api/auth/session` 返回：

- `hasSupabaseAuthCookie = false`
  说明浏览器根本没有写入登录 Cookie，优先检查邮件链接是否真的走到了 `/auth/callback`
- `hasSupabaseAuthCookie = true` 但 `session.exists = false`
  说明 Cookie 已经存在，但服务端没换出有效 session，优先检查 callback 流程和 Supabase Redirect 配置
- `session.exists = true` 但 `/workspace` 仍被踢回 `/login`
  说明要继续检查 middleware 中的 claims 读取是否一致

### 6.3 推荐排查顺序

1. 先打开 `/api/health`，确认环境变量状态正常
2. 打开 `/login`，发送 Magic Link
3. 点击邮箱里的登录链接
4. 确认浏览器最终跳到了 `http://localhost:3000/auth/callback?...`
5. 再访问 `/api/auth/session`
6. 最后访问 `/workspace`

如果第 4 步没有经过 `/auth/callback`，优先检查 Supabase 控制台里的 `Site URL` 和 `Redirect URL`。

补充说明：

- 如果邮件链接里带的是 `?code=...`，会走 `exchangeCodeForSession`
- 如果邮件链接里带的是 `?token_hash=...&type=magiclink` 或其他 `type`，会走 `verifyOtp`
- 两种都是 Supabase 正常的回调形式

---

## 7. 联调顺序建议

建议按这个顺序联调：

1. 打开 `/api/health`，确认环境变量正常
2. 完成邮箱登录闭环
3. 用 `/api/auth/session` 确认服务端已经拿到 session
4. 打开 `/workspace`
5. 创建一个新项目
6. 在编辑页测试手动保存和自动保存
7. 测试 AI 生成项目简介和服务范围
8. 打开分享页 `/share/[token]`

---

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
3. Supabase 的邮件认证能力是否已开启
4. `Redirect URL` 是否包含 `/auth/callback`

如果接口返回 `email rate limit exceeded`：

1. 这说明 Supabase 暂时限制了当前邮箱的发送频率，不是代码报废
2. 先等待 60 秒后重试
3. 或直接换一个新的测试邮箱继续联调

### 8.3 点击邮件后仍然回到登录页

优先检查：

1. 浏览器最终 URL 是否经过 `/auth/callback`
2. `/api/auth/session` 是否能看到 `sb-...-auth-token`
3. `Site URL` 是否配置为 `http://localhost:3000`
4. `Redirect URL` 是否包含 `http://localhost:3000/auth/callback`

### 8.4 工作台或项目详情仍然显示 mock 行为

优先检查：

1. `SUPABASE_SECRET_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY` 是否已配置
2. 数据库是否已经执行 SQL
3. `projects`、`quote_items` 等表里是否已有数据

### 8.5 AI 按钮能点，但结果像模板文案

这通常说明当前走的是 fallback。

优先检查：

1. `OPENAI_API_KEY` 是否已配置
2. 当前网络是否能访问 OpenAI API
3. `OPENAI_MODEL` 是否填写为可用模型名

---

## 9. 下一步建议

如果你准备继续推进，当前最值得优先完成的是：

1. 跑通 Supabase session 登录闭环
2. 验证 `/workspace`、项目保存、自动保存都走真实用户数据
3. 再继续做 AI、分享页和导出能力的联调

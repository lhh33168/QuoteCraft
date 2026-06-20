# QuoteCraft 本地联调说明

这份文档以当前项目代码为准。

当前登录主流程已经调整为：

- 使用邮箱数字验证码登录
- 首次登录也直接发送验证码
- 不依赖邮箱里的跳转链接回到 App
- `/auth/callback` 只保留为兜底，不作为主流程

## 1. 环境变量

在项目根目录创建 `.env.local`，至少配置下面这些值：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
NEXT_PUBLIC_CAPACITOR_SERVER_URL=
```

说明：

- 浏览器端至少需要 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 服务端建议优先配置 `SUPABASE_SECRET_KEY`
- 如果没有 `SUPABASE_SECRET_KEY`，再使用 `SUPABASE_SERVICE_ROLE_KEY`
- 首次登录的“补建用户再发验证码”依赖服务端 key；缺少它时，首次登录无法稳定走通
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 目前是兼容字段，建议与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 保持一致
- 未配置 `OPENAI_API_KEY` 时，AI 能力会退回本地兜底文案
- 如果要跑 Capacitor App，`NEXT_PUBLIC_CAPACITOR_SERVER_URL` 填线上域名，例如 `https://www.quotecraft.cn`

## 2. Supabase 初始化

### 2.1 执行数据库脚本

在 Supabase 控制台的 `SQL Editor` 中执行：

- [supabase-schema-and-rls.sql](/G:/QuoteCraft/supabase-schema-and-rls.sql)

如果这一步没执行完整，常见现象是：

- 能登录
- 能打开页面
- 但创建项目、读取项目或保存内容时报权限错误

### 2.2 配置 URL

在 `Auth -> URL Configuration` 中确认：

- `Site URL` 为 `http://localhost:3000`
- `Redirect URLs` 包含 `http://localhost:3000/auth/callback`

说明：

- 当前主流程不是靠这里的回跳完成登录
- 但 Supabase 邮件和兜底回调仍建议保留这个地址

## 3. 正确的邮件模板配置

### 3.1 主模板：`Magic Link or OTP`

进入：

- `Auth -> Email Templates -> Magic Link or OTP`

将模板改为基于 `{{ .Token }}`，不要把主流程建立在 `{{ .ConfirmationURL }}` 上。

推荐模板：

```html
<h2>QuoteCraft 邮箱验证码</h2>
<p>你的登录验证码是：<strong>{{ .Token }}</strong></p>
<p>这是 8 位数字验证码，请回到 QuoteCraft 登录页输入。</p>
<p>本次登录不依赖邮箱 App 跳回产品。</p>
```

当前产品主流程说明：

- 用户收到的是数字验证码
- 用户应该回到当前登录页输入验证码
- 不需要点击邮箱里的链接才能完成登录

### 3.2 `Confirm sign up` 模板

`Confirm sign up` 可以保留，但不再作为产品主链路。

建议文案写成兜底说明，而不是主登录说明，例如：

```html
<h2>QuoteCraft 邮箱确认</h2>
<p>这是一次账户初始化或邮箱确认邮件。</p>
<p>如果你正在 QuoteCraft 中登录，请优先返回登录页输入验证码完成登录。</p>
<p>如果邮件中包含确认链接，它只作为异常场景下的辅助验证方式。</p>
```

重点：

- 不要再把“点邮件链接回到 App”写成默认操作路径
- 登录页和邮件模板都应该强调“验证码输入”才是主流程

## 4. 当前真实登录链路

### 4.1 首次登录

当前后端实现是：

1. 用户输入邮箱
2. 服务端检查 Supabase 中是否已有该邮箱用户
3. 如果没有，服务端先补建 auth 用户
4. 再统一调用 `signInWithOtp({ shouldCreateUser: false })`
5. Supabase 发送 8 位数字验证码
6. 用户回到登录页输入验证码完成登录

### 4.2 非首次登录

流程为：

1. 输入邮箱
2. 发送验证码
3. 输入验证码登录

### 4.3 为什么不再依赖邮件回跳

因为邮箱是外部 App，在移动端场景下：

- 无法保证用户一定能从邮箱稳定跳回产品
- 体验容易断裂
- 验证码输入比魔法链接回跳更稳

所以当前已经统一成“验证码优先”方案。

## 5. 本地启动

如果 PowerShell 遇到 `npm.ps1` 执行策略问题，使用：

```bash
cmd /c npm run dev
```

启动后访问：

```text
http://localhost:3000
```

如果刚改过 `.env.local`，记得重启本地开发服务。

## 6. 健康检查

访问：

```text
http://localhost:3000/api/health
```

重点看这些值是否正常：

- `health.supabase.hasUrl`
- `health.supabase.hasPublishableKey`
- `health.supabase.hasServerKey`
- `health.supabase.browserConfigured`
- `health.supabase.serverConfigured`

如果 `hasServerKey` 或 `serverConfigured` 为 `false`，首次登录补建用户会失败。

## 7. 登录态检查

登录完成后访问：

```text
http://localhost:3000/api/auth/session
```

重点看：

- `auth.hasSupabaseAuthCookie`
- `auth.session.exists`
- `auth.user.exists`
- `auth.claims.email`

如果这些都正常，说明服务端已经真正拿到登录态。

## 8. 仍然收不到验证码时

按下面顺序排查：

1. 打开 `/api/health`，确认 `serverConfigured = true`
2. 确认 `.env.local` 指向的 Supabase 项目，就是你正在修改邮件模板的那个项目
3. 确认改的是 `Auth -> Email Templates -> Magic Link or OTP`
4. 确认模板里保留的是 `{{ .Token }}`
5. 确认模板里没有把主内容写成 `{{ .ConfirmationURL }}`
6. 确认没有触发 Supabase 邮件频率限制
7. 检查垃圾邮箱、广告邮件和聚合收件箱分类

## 9. 如果收到的还是链接，不是验证码

优先检查：

1. 当前 `.env.local` 指向的 Supabase 项目是否正确
2. 你正在 Supabase 控制台里修改的项目，是否就是当前代码连接的项目
3. 你修改的是不是 `Magic Link or OTP` 模板
4. 模板中是否仍残留 `{{ .ConfirmationURL }}`

多数情况下，问题不是前端代码，而是“当前运行环境连接的 Supabase 项目”和“你实际修改模板的项目”不是同一个。

## 10. 验证码校验失败时

优先检查：

1. 是否输入了最新一封邮件中的验证码
2. 当前验证码是否为 8 位数字
3. `/api/auth/verify` 返回的具体错误
4. `/api/auth/session` 中 `session.exists` 是否已经变成 `true`

常见含义：

- `expired`：验证码过期，需要重新发送
- `invalid`：验证码错误，或不是最新的一封

## 11. 推荐联调顺序

建议按这个顺序走：

1. 打开 `/api/health`
2. 确认 Supabase 浏览器端和服务端都配置正确
3. 打开 `/login`
4. 输入邮箱
5. 查收 8 位数字验证码
6. 在当前页面输入验证码登录
7. 打开 `/api/auth/session` 确认登录态
8. 进入 `/workspace`
9. 创建项目并验证保存、编辑、分享链路

## 12. 当前实现说明

首次登录的补建逻辑位置：

- [app/api/auth/login/route.ts](/G:/QuoteCraft/app/api/auth/login/route.ts)
- [server/auth/ensure-auth-user.ts](/G:/QuoteCraft/server/auth/ensure-auth-user.ts)

当前实现方式是：

- 服务端读取用户列表
- 在当前阶段按邮箱判断是否已存在
- 对当前项目体量足够可用

后续如果用户规模明显增大，可以再把按邮箱查用户的实现继续优化。

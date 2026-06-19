# QuoteCraft Capacitor 接入说明

## 1. 方案说明

当前项目是一个依赖服务端渲染和服务端鉴权的 Next.js 应用，包含：

- `app/api/*` 接口路由
- `server/*` 服务端逻辑
- Supabase SSR Cookie 登录态

因此这里不建议把项目改造成纯静态导出 App。现阶段最稳妥、成本最低的移动端方案是：

1. Web 站点先正常部署
2. Capacitor 作为原生壳，加载线上正式站点
3. Android / iOS 端共用现有 Web 业务逻辑

这个方案的优点：

- 不需要单独维护一套移动端后端
- 不会破坏现有 Next SSR 与 Supabase 鉴权
- 上线成本低，适合当前阶段快速发版验证

## 2. 本次已接入的内容

仓库里已经补充：

- `capacitor.config.ts`
- `capacitor-shell/index.html`
- `package.json` 中的 Capacitor 脚本
- `.env.example` 中的移动端变量
- `.gitignore` 中的 `android` / `ios`

## 3. 环境变量

在 `.env.local` 或发布环境中补充：

```env
NEXT_PUBLIC_CAPACITOR_SERVER_URL=https://你的正式站点域名
CAPACITOR_APP_ID=com.quotecraft.app
CAPACITOR_APP_NAME=QuoteCraft
```

说明：

- `NEXT_PUBLIC_CAPACITOR_SERVER_URL` 必填，建议填写正式 HTTPS 域名
- `CAPACITOR_APP_ID` 是应用唯一标识，发版后尽量不要修改
- `CAPACITOR_APP_NAME` 是 App 展示名称

如果你只是本地临时调试 Android 模拟器，也可以先写：

```env
NEXT_PUBLIC_CAPACITOR_SERVER_URL=http://10.0.2.2:3000
```

说明：

- `10.0.2.2` 是 Android 模拟器访问宿主机 `localhost` 的地址
- 真机调试时要换成你电脑在局域网内可访问的 IP
- iOS 模拟器一般可直接用局域网地址，不建议长期依赖本地地址

## 4. 可用脚本

```bash
cmd /c npm run cap:doctor
cmd /c npm run cap:add:android
cmd /c npm run cap:add:ios
cmd /c npm run cap:copy
cmd /c npm run cap:sync
cmd /c npm run cap:open:android
cmd /c npm run cap:open:ios
```

用途说明：

- `cap:doctor`：检查 Capacitor 环境
- `cap:add:android`：生成 Android 原生工程
- `cap:add:ios`：生成 iOS 原生工程
- `cap:copy`：复制配置到原生工程
- `cap:sync`：同步插件和配置
- `cap:open:android`：用 Android Studio 打开工程
- `cap:open:ios`：用 Xcode 打开工程

## 5. 推荐接入顺序

### 5.1 先部署线上站点

推荐组合：

- 前端部署：Vercel
- 数据与鉴权：Supabase

先确保以下地址在线可访问：

- 首页
- 登录页
- 工作台
- 分享页
- `api/health`

### 5.2 配置正式域名

把正式域名写入：

```env
NEXT_PUBLIC_CAPACITOR_SERVER_URL=https://你的正式站点域名
```

同时确认：

- Supabase `Site URL` 已切换到正式域名
- Supabase `Redirect URL` 中包含正式域名下的 `/auth/callback`
- 登录验证码邮件链路在正式环境可用

### 5.3 生成 Android / iOS 工程

Android：

```bash
cmd /c npm run cap:add:android
cmd /c npm run cap:sync
cmd /c npm run cap:open:android
```

iOS：

```bash
cmd /c npm run cap:add:ios
cmd /c npm run cap:sync
cmd /c npm run cap:open:ios
```

## 6. 当前配置解读

`capacitor.config.ts` 当前使用的是“远程站点壳 + 本地占位入口”模式：

- 如果存在 `NEXT_PUBLIC_CAPACITOR_SERVER_URL`
  - App 会直接加载该远程站点
- 如果没填这个变量
  - 会先落到 `capacitor-shell/index.html`
  - 这个页面只是一个占位入口，方便 `cap copy` / `cap sync` 正常执行
  - 不会误把 `.next` 当成静态网站目录来复制

这和当前项目阶段是匹配的。

## 7. 本地调试建议

### 7.1 先调通 Web

先保证：

- `cmd /c npm run dev` 正常启动
- 浏览器访问 `http://localhost:3000` 正常
- 登录、创建项目、分享页都可用

### 7.2 再调 Android 模拟器

开发时可暂用：

```env
NEXT_PUBLIC_CAPACITOR_SERVER_URL=http://10.0.2.2:3000
```

然后执行：

```bash
cmd /c npm run cap:add:android
cmd /c npm run cap:sync
cmd /c npm run cap:open:android
```

注意：

- 只有当本地 `next dev` 正在运行时，这种方式才可用
- 这种方式只适合调试，不适合发正式包

## 8. 正式发布建议

推荐分两步：

1. 先发 PWA / Web 正式版
2. 再发 Capacitor Android 包

原因：

- Android 上架门槛低，适合优先验证
- iOS 上架需要更完整的苹果开发者流程
- 当前业务还在快速迭代，先用同一套 Web 主站能减少维护成本

## 9. 后续可继续补的能力

下一阶段如果你要继续推进移动端，我建议按这个顺序做：

1. 补应用图标与启动屏
2. 补 `@capacitor/app`、`@capacitor/browser` 等常用插件
3. 优化移动端安全域名与白名单
4. 增加 PWA 配置，形成“Web + App 壳”双发布
5. 增加原生分享、文件下载、通知等能力

## 10. 你现在最适合的下一步

如果你准备继续，我建议直接做这两件事：

1. 先把正式域名定下来并填入 `NEXT_PUBLIC_CAPACITOR_SERVER_URL`
2. 我继续帮你把 Android 目录和基础 App 配置也生成出来

这样你就能真正开始打 Android 包了。

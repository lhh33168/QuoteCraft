# iOS 打包说明

本文档对应 `QuoteCraft` 当前的 Capacitor 方案：`Next.js Web 正式站点 + Capacitor iOS 外壳`。

## 当前状态

仓库已经具备以下内容：

- `ios/` 原生工程
- `capacitor.config.ts`
- 默认 App 图标与启动图
- `pnpm.cmd cap:sync` 同步脚本
- `pnpm.cmd ios:release:preflight` 预检查脚本

注意：

- 真正的 `.ipa` 打包必须在 `macOS + Xcode` 环境完成
- 当前这台 Windows 机器不能直接产出 `.ipa`

## 发布前准备

先确认 `.env.local` 至少包含：

```env
NEXT_PUBLIC_CAPACITOR_SERVER_URL=https://your-production-domain.example.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
CAPACITOR_APP_ID=cn.quotecraft.app
CAPACITOR_APP_NAME=报价助手
```

建议：

- `NEXT_PUBLIC_CAPACITOR_SERVER_URL` 使用正式 `https` 域名
- `CAPACITOR_APP_ID` 一旦进入发布流程，尽量不要再改
- `CAPACITOR_APP_NAME` 保持和 App Store 展示名称一致

## 在 Windows 上能做什么

1. 同步 Capacitor 配置和 Web 资源

```bash
pnpm.cmd cap:sync
```

2. 运行预检查

```bash
pnpm.cmd ios:release:preflight
```

这个检查会确认：

- `ios/` 工程是否存在
- `Info.plist`、`Podfile`、图标、启动图是否存在
- 关键环境变量是否已配置
- 当前机器是否具备 `CocoaPods`、`xcodebuild`

## 在 Mac 上打包

### 1. 安装基础环境

确保下面这些工具可用：

- Xcode
- Xcode Command Line Tools
- CocoaPods
- Node.js
- pnpm

推荐先验证：

```bash
xcodebuild -version
pod --version
node -v
pnpm -v
```

### 2. 同步项目

在仓库根目录执行：

```bash
pnpm install
pnpm cap:sync
```

如果你更新了 `.env.local`、插件或 `capacitor.config.ts`，也要重新执行一次 `pnpm cap:sync`。

### 3. 运行 iOS 预检查

在 Mac 上执行：

```bash
pwsh ./scripts/ios/release-preflight.ps1
```

如果 Mac 没有 `pwsh`，也可以按同样检查项手动确认。

### 4. 安装 Pods

首次或插件变更后，进入 iOS 工程目录：

```bash
cd ios/App
pod install
```

### 5. 用 Xcode 打开工程

一定要打开：

```text
ios/App/App.xcworkspace
```

不要只打开 `App.xcodeproj`，否则 Pods 依赖可能不完整。

### 6. 配置签名

在 Xcode 中打开后，检查：

- `Signing & Capabilities`
- `Team`
- `Bundle Identifier`
- `Display Name`
- `Version`
- `Build`

建议：

- `Bundle Identifier` 与 `CAPACITOR_APP_ID` 保持一致
- `Version` 对应用户可见版本号
- `Build` 每次提交 TestFlight 前递增

### 7. 真机验证

先连接一台 iPhone 做一次运行验证，重点检查：

- 首页是否能正常打开
- 远程站点是否可访问
- 登录流程是否可用
- 分享、下载、文件能力是否正常

### 8. Archive 并导出

Xcode 菜单：

```text
Product -> Archive
```

完成后在 Organizer 中：

- 选择 `Distribute App`
- 按目标选择 `App Store Connect` 或 `Ad Hoc`
- 导出 `.ipa` 或直接上传 TestFlight

## 常见问题

### 1. Windows 上为什么不能直接打 iOS 包

因为 iOS 打包依赖：

- `xcodebuild`
- Apple 签名链
- Xcode Archive 流程

这些都只能在 macOS 上完成。

### 2. 为什么 `cap sync` 后还需要 `pod install`

因为 Capacitor iOS 插件依赖通过 CocoaPods 管理，插件变化后需要重新安装 Pods。

### 3. 用远程站点壳模式时最容易漏什么

最常漏的是：

- 正式 `https` 域名还没准备好
- Supabase 回调地址没配置正式域名
- iOS 真机网络环境下接口权限或回调地址不一致

## 推荐发布顺序

1. 先确认 Web 正式站点完全可用
2. 再在 iPhone 真机上验证 Capacitor 壳
3. 最后 Archive 并发到 TestFlight

这会比先折腾原生打包更稳。

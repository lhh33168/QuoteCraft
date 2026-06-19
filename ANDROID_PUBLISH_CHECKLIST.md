# QuoteCraft Android 上架前检查清单

## 1. 先跑自动自检

每次准备发版前，先执行：

```bash
cmd /c npm run android:release:preflight
```

如果输出最后是：

```text
release-preflight=pass
```

说明硬性检查已通过。

如果输出最后是：

```text
release-preflight=fail
```

说明还有必须补的项。

## 2. 自动自检当前会检查什么

- `android/keystore.properties` 是否存在
- `keystore` 文件是否存在
- `release aab` 是否已生成
- `.env.local` 中是否存在 `NEXT_PUBLIC_CAPACITOR_SERVER_URL`
- 移动端站点地址是否使用 `https`
- Supabase URL 是否使用 `https`
- `androidApplicationId` 是否仍是默认值
- `androidAppName` 是否仍是默认值
- `androidVersionCode` 是否有效
- `androidVersionName` 是否已设置

## 3. 正式上架前建议人工确认

### 3.1 应用身份

- 应用名是否为正式名称
- 包名是否为正式包名
- 版本号是否正确
- 版本号是否高于上一个版本

### 3.2 服务端环境

- `NEXT_PUBLIC_CAPACITOR_SERVER_URL` 是否指向正式 HTTPS 域名
- 正式域名是否能正常打开首页、登录页、工作台、分享页
- Supabase `Site URL` 是否切到正式域名
- Supabase `Redirect URL` 是否包含正式域名下的 `/auth/callback`

### 3.3 登录与核心功能

- 邮箱验证码登录是否正常
- 工作台列表是否正常
- 新建项目是否正常
- 编辑保存是否正常
- 分享页是否正常
- 打印页是否正常

### 3.4 安装与更新

- Debug 包和 Release 包是否分开管理
- 真机安装 Release 包是否正常
- 应用升级安装是否正常

### 3.5 视觉与品牌

- 应用图标是否为正式版
- 启动页是否为正式版
- 应用名是否没有默认占位文案

## 4. 当前最推荐的发版顺序

1. 改正式域名
2. 运行 `cmd /c npm run cap:sync`
3. 运行 `cmd /c npm run android:release:preflight`
4. 运行 `cmd /c npm run android:bundle:release`
5. 真机安装验证
6. 准备上传 Google Play

## 5. 产物位置

- Debug APK：
  `android/app/build/outputs/apk/debug/app-debug.apk`
- Release AAB：
  `android/app/build/outputs/bundle/release/app-release.aab`

## 6. 你下一步最该做什么

当前最值得优先处理的是：

1. 把 `NEXT_PUBLIC_CAPACITOR_SERVER_URL` 改成正式 HTTPS 域名
2. 把 `androidApplicationId` 和 `androidAppName` 改成正式值
3. 再跑一次 `android:release:preflight`

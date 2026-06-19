# QuoteCraft Android 打包发布说明

## 1. 当前状态

当前仓库已经完成：

- Capacitor Android 工程初始化
- Android Studio 打开链路打通
- `cap copy` / `cap sync` 可正常执行
- Android 打包脚本已补充到 `package.json`

你现在已经可以开始产出测试包。

## 2. 先决条件

请先确认这几项：

1. Android Studio 已安装
2. Android SDK 已在 Android Studio 内安装完成
3. 本机已安装 JDK
4. Web 正式站点已经可访问
5. `.env.local` 已配置正式域名

推荐的正式域名配置：

```env
NEXT_PUBLIC_CAPACITOR_SERVER_URL=https://你的正式站点域名
CAPACITOR_APP_ID=com.quotecraft.app
CAPACITOR_APP_NAME=QuoteCraft
CAPACITOR_ANDROID_STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe
```

## 3. 每次打包前推荐执行

先同步 Capacitor 配置：

```bash
cmd /c npm run cap:sync
```

如果你改过：

- `capacitor.config.ts`
- `.env.local`
- Capacitor 插件
- 占位壳资源

都建议先执行一次 `cap:sync`。

## 4. 生成 Debug APK

这个包适合：

- 本机测试
- 真机安装联调
- 内部预览

执行：

```bash
cmd /c npm run android:assemble:debug
```

生成后的文件通常在：

- `android/app/build/outputs/apk/debug/app-debug.apk`

## 5. 生成 Release APK

执行：

```bash
cmd /c npm run android:assemble:release
```

生成后的文件通常在：

- `android/app/build/outputs/apk/release/app-release.apk`

注意：

- 默认情况下，这个 Release 包还没有做正式签名
- 未签名或调试签名的包不适合正式上架

## 6. 生成 Release AAB

如果你后面要上 Google Play，更推荐生成 `AAB`：

```bash
cmd /c npm run android:bundle:release
```

输出目录通常在：

- `android/app/build/outputs/bundle/release/app-release.aab`

## 7. Release 签名配置

当前仓库已经补好了签名模板：

- [keystore.properties.example](/g:/QuoteCraft/android/keystore.properties.example)

你正式发版前需要准备：

1. 一个自己的 `keystore`
2. 一个不入库的 `android/keystore.properties`

### 7.1 keystore 文件建议位置

建议放在：

- `android/keystores/quotecraft-release.jks`

这个目录已经加入 `.gitignore`，不会误提交。

### 7.2 keystore.properties 写法

可以参考模板，把它复制成：

- `android/keystore.properties`

内容格式：

```properties
storeFile=../keystores/quotecraft-release.jks
storePassword=你的store密码
keyAlias=quotecraft
keyPassword=你的key密码
```

说明：

- `storeFile` 路径是相对 `android/app` 来解析的
- 正式密码不要提交到仓库

### 7.3 推荐直接用仓库脚本生成

当前仓库已经补了两个命令：

```bash
cmd /c npm run android:keystore:create -- -StorePassword 你的store密码 -KeyPassword 你的key密码
cmd /c npm run android:keystore:write -- -StorePassword 你的store密码 -KeyPassword 你的key密码
```

第一个命令会：

- 生成 `android/keystores/quotecraft-release.jks`

第二个命令会：

- 生成 `android/keystore.properties`

如果你还想自定义别名或证书主体，也可以继续传：

```bash
cmd /c npm run android:keystore:create -- -StorePassword 你的store密码 -KeyPassword 你的key密码 -Alias quotecraft -DName "CN=QuoteCraft, OU=Mobile, O=QuoteCraft, L=Shanghai, ST=Shanghai, C=CN"
```

### 7.4 当前构建行为

当前 `android/app/build.gradle` 已配置为：

- 如果存在 `android/keystore.properties`
  - Release 构建自动使用正式签名
- 如果不存在
  - 仍可继续本地调试
  - 但 Release 包不适合正式上架

### 7.5 快速检查签名状态

你可以随时执行：

```bash
cmd /c npm run android:signing:check
```

可能结果：

- `release-signing-configured`
- `release-signing-missing`

## 8. 更推荐的正式发布方式

正式上架时建议走 Android Studio：

1. 打开 Android Studio
2. 打开 `Build`
3. 选择 `Generate Signed Bundle / APK`
4. 选择 `Android App Bundle`
5. 配置 keystore
6. 生成签名后的正式包

原因：

- 图形界面更不容易出错
- 签名配置更直观
- 便于后面持续发版

## 9. 你后面一定会补的内容

当前这套结构已经能打包，但正式发版前建议补齐：

1. App 图标
2. 启动页
3. 应用版本号
4. Release 签名配置
5. 正式域名白名单检查
6. 登录态与分享页的真机验证

## 10. 正式修改应用名和包名时要改哪里

当前仓库已经把 Android 侧大部分身份配置集中到了：

- `android/variables.gradle`

其中包括：

- `androidAppName`
- `androidApplicationId`
- `androidCustomUrlScheme`
- `androidVersionCode`
- `androidVersionName`

但如果你后面真的要把包名从 `com.quotecraft.app` 改成正式包名，还需要同步处理：

1. `capacitor.config.ts` 里的默认 `appId`
2. `.env.local` 或发布环境里的 `CAPACITOR_APP_ID`
3. `android/app/src/main/java/.../MainActivity.java` 的包路径
4. `android/app/src/main/java/...` 目录结构

也就是说：

- 应用名、版本号可以只改 `android/variables.gradle`
- 真正的 Java 包名变更，仍然需要一起改原生目录结构

## 11. 当前最建议的下一步

建议你先做这一轮：

1. 把 `NEXT_PUBLIC_CAPACITOR_SERVER_URL` 改成正式 HTTPS 域名
2. 执行 `cmd /c npm run cap:sync`
3. 执行 `cmd /c npm run android:assemble:debug`
4. 先在本机或真机装一个 Debug 包验证登录、工作台、分享页

## 12. 如果你继续让我往下做

我下一步最适合直接帮你处理的是：

1. 把应用名和包名改成正式发布值
2. 给 Android 工程补一版品牌图标和启动页资源结构
3. 加签名配置模板
4. 帮你把首次 APK / AAB 产出链路跑通

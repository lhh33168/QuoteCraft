# 报价助手 Google Play 上架步骤

## 1. 当前项目状态

当前 Android 侧已经具备这些条件：

- 应用名：`报价助手`
- 包名：`cn.quotecraft.app`
- 正式域名：`https://quotecraft.cn`
- Release 签名已配置
- Release AAB 已可生成
- 发布前自检已通过

当前正式产物路径：

- `android/app/build/outputs/bundle/release/app-release.aab`

## 2. 上架前准备

正式进入 Google Play Console 之前，先确认：

1. 你有可用的 Google Play 开发者账号
2. `cmd /c npm run android:release:preflight` 输出为 `release-preflight=pass`
3. 你已经生成最新 `AAB`
4. 你已经准备好应用图标、截图、隐私政策链接
5. `https://quotecraft.cn` 已可正常访问

推荐先重新执行：

```bash
cmd /c npm run cap:sync
cmd /c npm run android:release:preflight
cmd /c npm run android:bundle:release
```

## 3. 进入 Play Console 创建应用

在 Google Play Console 中：

1. 登录开发者后台
2. 点击 `Create app`
3. 填写应用名：`报价助手`
4. 选择默认语言
5. 选择应用或游戏：`App`
6. 选择免费或付费
7. 按要求确认声明

建议：

- 中文主名称先用 `报价助手`
- 如果以后官网品牌想保留英文，可在说明文案中补充 `QuoteCraft`

## 4. 完成应用主页信息

在 `Store listing` 中准备：

- 应用名称
- 简短说明
- 详细说明
- 应用图标
- 手机截图
- 隐私政策链接
- 联系邮箱

对你这个项目，至少建议准备：

1. 登录页截图
2. 工作台截图
3. 项目编辑页截图
4. 分享页截图

## 5. 完成 Play Console 必填声明

在正式提交审核前，通常还需要完成这些模块：

- `App content`
- `Data safety`
- `Content rating`
- `Target audience`
- `Ads`
- `App access`

对你这个项目，特别注意：

### 5.1 App access

因为你的应用有登录态，审核时建议提供：

- 测试账号
- 测试验证码获取方式
- 审核人员可复现的登录步骤

如果审核人员无法进入主要功能，容易被卡住。

### 5.2 Data safety

你需要按真实情况填写：

- 是否收集邮箱
- 是否处理用户创建的项目内容
- 是否与第三方共享数据
- 数据是否加密传输

不要为了快随便填，后面被抽查会有风险。

### 5.3 Privacy policy

如果应用里有登录、用户数据、云端同步，建议务必准备一页正式隐私政策。

## 6. 先走测试轨道，不要直接上 Production

最稳的顺序是：

1. `Internal testing`
2. `Closed testing`
3. `Production`

推荐你先上传到 `Internal testing`：

1. 进入 `Release > Testing > Internal testing`
2. 创建新版本
3. 上传 `app-release.aab`
4. 填写版本说明
5. 添加测试人员邮箱
6. 发布到内部测试轨道

这样做的好处：

- 可以先验证安装
- 可以先验证登录
- 可以先验证正式域名访问
- 可以提前发现审核前问题

## 7. 你当前最适合的上传顺序

结合你现在的项目状态，建议按这个顺序走：

### 第一步

上传当前最新：

- `android/app/build/outputs/bundle/release/app-release.aab`

先发到：

- `Internal testing`

### 第二步

在真机上验证：

- 安装是否正常
- 启动是否正常
- 登录是否正常
- 工作台是否正常
- 新建项目是否正常
- 分享页是否正常

### 第三步

确认以下都没问题后，再准备 `Production`：

- 审核账号已提供
- 隐私政策已提供
- 数据安全声明已完成
- 商店素材已齐

## 8. 提交 Production 前最后检查

提交正式审核前，建议再检查一遍：

1. 包名是否正确：`cn.quotecraft.app`
2. 应用名是否正确：`报价助手`
3. 正式域名是否正确：`https://quotecraft.cn`
4. 签名是否正确
5. 版本号是否需要提升
6. 截图是否是正式版界面
7. 隐私政策是否可公开访问
8. 审核账号是否真实可用

## 9. 版本号建议

当前项目还是：

- `androidVersionCode = 1`
- `androidVersionName = 1.0.0`

如果你后面每发一次新版本，建议至少这样递增：

- `1.0.0` -> `1.0.1`
- `versionCode`：`1` -> `2`

Google Play 不允许重复使用旧版本号。

## 10. 审核期间的建议

Google Play 审核期间建议：

- 不要随意重复撤回和重提
- 审核说明里写清登录方式
- 如需验证码登录，尽量给审核人员稳定可用的测试邮箱
- 如果依赖线上接口，确保正式域名稳定可访问

## 11. 当前你下一步最该做什么

如果你准备正式往前走，我建议马上做这两件事：

1. 准备 Play Console 需要的商店素材
2. 先把当前 `AAB` 上传到 `Internal testing`

## 12. 官方参考

- Play Console 主页：`https://play.google.com/console/about/`
- Android App Bundle 官方说明：`https://developer.android.com/guide/app-bundle`
- Play Console 政策中心：`https://support.google.com/googleplay/android-developer/topic/9858052`

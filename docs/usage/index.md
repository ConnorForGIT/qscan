# 开始之前

**在开始之前，请确定已经准备好了下列设备和账号：**

- 一台 macOS 的设备，苹果电脑
- 一台安卓设备，推荐使用红米5
- 一个懒人支架，或者其他能够固定扫码设备的装置
- 一个微信账号，由于用于扫码，因此最好是不常用的账号或小号（微信号首次登录新设备时，需要手动进行身份验证）

## 验证环境

设备准备好之后，请 **务必** 准备好下列软硬件环境：

#### 1. 手机状态
- [x] 关闭锁屏，关闭自动息屏，息屏状态无法唤起 Appium 扫码
- [x] 开启开发者模式
- [x] 将手机与电脑相连，并将手机固定在电脑前

#### 2. 微信状态

- [x] 确认账号是可登陆状态，首次登陆需要进行身份验证
- [x] 禁用 X5 内核: 在微信中打开 debugtbs.qq.com, 在 tbs 调试页面中禁用内核（这是因为 Appium 无法获取基于 X5 内核页面中的元素，也就无法完成点击操作）

#### 3. 物理环境
- [x] 确保扫码的环境不会出现强烈的光照或其他遮挡物，光照会引起反光影响扫码
- [x] 尽量保证扫码设备不被人为干扰，例如使用围栏、警示标语等

#### 4. QScan 环境
- [x] 阅读 [配置](/documents/course.html#配置) ，写好配置后使用 ```doctor``` 命令检查运行环境

# Neon Raiden - PWA 配置指南

## 📱 项目已配置为完整的PWA应用

### 已创建的文件说明

#### 1. **Logo与Favicon**
- `public/logo.svg` - 512x512 主logo（赛博朋克霓虹风格）
- `public/favicon.svg` - 32x32 favicon（简化版logo）

#### 2. **PWA配置文件**
- `public/manifest.json` - Web App Manifest，定义应用元数据
  - 应用名称：Neon Raiden
  - 显示模式：standalone（全屏应用模式）
  - 主题色：#00ff88（荧光绿）
  - 背景色：#0a0a0a（深黑色）

#### 3. **Service Worker**
- `public/service-worker.js` - 离线支持和缓存管理
  - 自动缓存关键资源
  - 网络优先策略（Network First）
  - 离线时使用缓存

#### 4. **HTML更新**
- `index.html` 已更新：
  - ✅ 添加了完整的PWA meta标签
  - ✅ iPhone Safari支持（apple-mobile-web-app-capable等）
  - ✅ 多个尺寸的apple-touch-icon
  - ✅ Service Worker注册脚本
  - ✅ 主题色和SEO优化

#### 5. **启动屏幕**
- `public/splash-screen.html` - iOS启动屏幕（可选）
  - 带有pulsing动画的logo
  - loading进度条
  - 符合neon主题的设计

---

## 🚀 使用方法

### 本地测试
```bash
npm run dev
```
访问 `http://localhost:5173`

### 构建生产版本
```bash
npm build
```

### 在iPhone Safari中安装PWA

1. **使用Safari打开网站**
   - 访问你的应用URL

2. **添加到主屏幕**
   - 点击Safari底部的分享按钮 📤
   - 选择"添加到主屏幕"
   - 自定义应用名称（可选）
   - 点击"添加"

3. **从主屏幕启动**
   - 点击Neon Raiden图标
   - 应用将以全屏standalone模式启动
   - 离线状态下仍可使用缓存的资源

### 在Android Chrome中安装PWA

1. **打开应用页面**
2. **点击地址栏旁的"安装应用"按钮**
3. **确认安装**

---

## ✨ PWA功能特性

### 已启用的功能
- ✅ **离线支持** - 通过Service Worker缓存
- ✅ **全屏显示** - standalone模式，隐藏浏览器UI
- ✅ **自定义图标** - 高质量SVG logo
- ✅ **主题色** - 霓虹绿配色 (#00ff88)
- ✅ **设备屏幕适配** - viewport-fit=cover支持刘海屏
- ✅ **iOS支持** - apple-mobile-web-app标签
- ✅ **快捷方式** - "Start Game"快速启动

### iPhone Safari特性
- 无状态栏 - `apple-mobile-web-app-status-bar-style: black-translucent`
- 自定义标题 - "Neon Raiden"显示在主屏幕
- 多尺寸图标 - 支持180x180, 167x167, 152x152, 120x120像素

---

## 🔧 自定义配置

### 修改应用名称
编辑 `manifest.json`：
```json
{
  "name": "你的应用名称",
  "short_name": "短名称"
}
```

### 修改颜色主题
1. **index.html** - 修改 `theme-color` meta标签
2. **manifest.json** - 修改 `theme_color` 和 `background_color`
3. **Logo** - 编辑 SVG 文件中的颜色值

### 自定义Service Worker缓存
编辑 `public/service-worker.js` 中的 `ASSETS_TO_CACHE` 数组，添加要缓存的额外资源。

---

## 📊 PWA检测工具

### 在线检测
- [PWA Builder](https://www.pwabuilder.com/) - Microsoft的PWA验证工具
- [WebPageTest](https://www.webpagetest.org/) - 性能和PWA检测
- [Chrome DevTools** - Lighthouse审计（F12 > Lighthouse）

### 本地检测
1. 打开Chrome DevTools（F12）
2. 转到 **Lighthouse** 标签
3. 选择 **PWA** 审计
4. 点击 **分析** 按钮

---

## 🎨 设计特点

### Logo设计
- **主题**：赛博朋克 (Cyberpunk) 霓虹风格
- **颜色**：荧光绿 (#00ff88) + 紫红色 (#ff00ff)
- **元素**：闪电/雷电符号 + 网格背景 + 发光效果
- **风格**：与Neon Raiden游戏主题完全契合

### 品牌一致性
所有资源（logo、favicon、启动屏幕）都使用相同的配色和设计语言，确保视觉一致性。

---

## 🐛 常见问题

### Q: iOS上看不到Service Worker？
A: iOS会自动管理缓存，不显示Service Worker状态。这是正常的。

### Q: 应用在iPhone上没有全屏显示？
A: 确保 `viewport-fit=cover` 和 `apple-mobile-web-app-capable` 已设置。

### Q: 离线不能工作？
A: 检查浏览器开发者工具的Application标签，确认Service Worker已激活（状态为"activated"）。

### Q: 如何强制更新缓存？
A: 修改 `service-worker.js` 中的 `CACHE_NAME` 版本号，浏览器会自动更新。

---

## 📚 相关资源

- [MDN - Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Apple Developer - Configuring Web Apps](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

**配置日期**: 2025年11月26日  
**PWA支持**: ✅ iOS Safari | ✅ Android Chrome | ✅ 离线模式

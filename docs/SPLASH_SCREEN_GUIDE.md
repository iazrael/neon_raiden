# iOS启动屏配置指南

本指南说明了如何为Neon Raiden游戏配置iOS启动屏。

## 启动屏图片生成

启动屏图片已根据游戏的霓虹风格进行了设计，包含以下元素：
1. 黑色背景 (#0a0a0a)
2. 霓虹绿色网格背景
3. 简化的霓虹绿色闪电Logo
4. 游戏中文名称 "霓电战记"
5. 游戏英文名称 "NEON RAIDEN"
6. 加载提示文字 "Loading Game..."

### 支持的设备

- iPhone SE (1st generation) and iPhone 8
- iPhone 8 Plus
- iPhone X, XS, 11 Pro
- iPhone XR, 11
- iPhone XS Max, 11 Pro Max
- iPhone 12, 12 Pro, 13, 13 Pro
- iPhone 12 Mini, 13 Mini
- iPhone 12 Pro Max, 13 Pro Max, 14 Plus
- iPhone 14, 15
- iPhone 14 Pro, 15 Pro
- iPhone 14 Pro Max, 15 Pro Max

### 生成启动屏图片

运行以下命令生成所有设备的启动屏图片：

```bash
npm run splash
```

生成的图片将保存在 `public/assets/` 目录中。

### 启动屏HTML配置

启动屏HTML文件 (`public/splash-screen.html`) 已配置了以下内容：

1. 适配多种iOS设备的 `apple-touch-startup-image` 标签
2. 内联背景色样式避免白屏
3. 智能跳过机制（用户可点击、按键或等待自动跳转）
4. 最小显示时间设置（确保品牌展示）
5. 预加载主应用资源

### Manifest配置

`public/manifest.json` 文件已将 `start_url` 设置为 `./splash-screen.html`，确保PWA启动时先加载启动屏。

## 自定义启动屏

如果需要自定义启动屏设计，可以修改 `generate-splash-screens.js` 脚本中的以下函数：

- `drawGrid()` - 网格背景绘制
- `drawSimpleLogo()` - Logo绘制
- `drawText()` - 文字绘制

修改后重新运行 `npm run splash` 命令生成新的启动屏图片。
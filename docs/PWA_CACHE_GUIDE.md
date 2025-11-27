# PWA 离线缓存自动化方案

## 概述

本项目实现了一个自动化的 PWA 离线缓存方案，能够在每次 Vite 编译时：
1. 自动扫描 `public` 目录下的所有文件
2. 将文件列表注入到 Service Worker 的离线缓存列表中
3. 基于文件内容生成哈希值，确保文件变更时 Service Worker 能够自动更新

## 工作原理

### 1. Service Worker 注入插件 (`vite-plugins/sw-inject-plugin.ts`)

插件已被提取为独立的可复用模块，提供了清晰的接口和配置选项。

#### 核心功能：

- **递归扫描文件**：`getAllFiles()` 函数递归扫描 `dist` 目录，获取所有文件的相对路径
- **计算内容哈希**：`calculateFilesHash()` 函数读取所有文件内容并计算 MD5 哈希值（取前8位）
- **生成缓存名称**：结合版本号和文件哈希生成唯一的缓存名称，格式为 `{appName}-v{major}.{minor}.{patch}-{hash}`
- **注入 Service Worker**：将缓存名称和文件列表注入到 `service-worker.js` 中

#### 配置选项：

```typescript
export interface SwInjectPluginOptions {
    /**
     * Service Worker 文件名
     * @default 'service-worker.js'
     */
    swFileName?: string;
    
    /**
     * 应用名称，用于生成缓存名称
     * @default 'app'
     */
    appName?: string;
    
    /**
     * 版本号（major.minor.patch）
     */
    version: {
        major: string;
        minor: string;
        patch: string;
    };
    
    /**
     * 需要排除的文件模式
     * @default []
     */
    excludePatterns?: string[];
}
```

#### 使用示例（在 `vite.config.ts` 中）：

```typescript
import { swInjectPlugin } from './vite-plugins/sw-inject-plugin';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        // Service Worker 注入插件
        swInjectPlugin({
            appName: 'neon-raiden',
            version: { major, minor, patch },
            // 可选：排除特定文件
            // excludePatterns: ['.map', 'stats.html']
        }),
    ],
});
```

### 2. Service Worker 模板 (`public/service-worker.js`)

Service Worker 文件使用占位符，在构建时会被替换为实际值：

```javascript
// 占位符会在构建时被替换
const CACHE_NAME = '__APP_CACHE_NAME__';
const ASSETS_TO_CACHE = __ASSETS_TO_CACHE__;
```

构建后会变成：

```javascript
const CACHE_NAME = 'neon-raiden-v1.1.229-b7a63f54';
const ASSETS_TO_CACHE = [
    "./assets/index-DtZy3E5l.js",
    "./assets/sprites/bosses/boss_1.svg",
    "./favicon.svg",
    "./index.html",
    // ... 所有其他文件
];
```

## 缓存更新机制

### 自动更新触发条件

Service Worker 会在以下情况下自动更新：

1. **文件内容变更**：任何 `public` 目录下的文件内容发生变化，都会导致哈希值改变
2. **文件增删**：添加或删除文件会改变文件列表，从而改变哈希值
3. **版本号更新**：`package.json` 中的版本号更新

### 更新流程

1. 用户访问网站时，浏览器检测到新的 Service Worker
2. 新的 Service Worker 进入 `install` 阶段，创建新的缓存（使用新的 `CACHE_NAME`）
3. 新的 Service Worker 进入 `activate` 阶段，删除旧的缓存
4. 用户刷新页面后使用新的缓存

## 使用方法

### 开发环境

```bash
npm run dev
```

开发环境下 Service Worker 不会被激活，使用正常的开发服务器。

### 生产构建

```bash
npm run build
```

构建完成后，控制台会显示：

```
✓ Service Worker injected successfully
  Cache Name: neon-raiden-v1.1.229-b7a63f54
  Files to cache: 48
```

### 预览构建结果

```bash
npm run preview
```

## 注意事项

1. **Service Worker 作用域**：Service Worker 必须放在根目录才能控制整个应用
2. **HTTPS 要求**：Service Worker 只能在 HTTPS 或 localhost 环境下工作
3. **缓存策略**：当前使用的是 "Cache First" 策略，优先从缓存读取
4. **调试技巧**：
   - Chrome DevTools → Application → Service Workers 可以查看 SW 状态
   - Chrome DevTools → Application → Cache Storage 可以查看缓存内容
   - 可以手动 Unregister Service Worker 来清除缓存

## 文件结构

```
neon_raiden/
├── public/
│   ├── service-worker.js          # Service Worker 模板
│   ├── manifest.json               # PWA 配置
│   ├── assets/                     # 游戏资源（会被自动缓存）
│   │   └── sprites/
│   │       ├── bosses/
│   │       ├── bullets/
│   │       ├── enemies/
│   │       └── fighters/
│   └── ...                         # 其他静态资源
├── vite.config.ts                  # Vite 配置（包含注入插件）
└── dist/                           # 构建输出目录
    ├── service-worker.js           # 注入后的 Service Worker
    └── ...                         # 其他构建文件
```

## 技术细节

### 哈希算法

使用 MD5 算法计算所有文件内容的哈希值，取前8位作为版本标识。这样可以确保：
- 任何文件内容变化都会导致哈希值改变
- 哈希值足够短，不会让缓存名称过长
- 哈希冲突概率极低（2^32 种可能性）

### 缓存策略

当前实现的是 **Cache First** 策略：

1. 首先检查缓存中是否有匹配的资源
2. 如果有，直接返回缓存的资源
3. 如果没有，从网络获取资源
4. 将网络获取的资源添加到缓存中
5. 如果网络请求失败，尝试从缓存中返回（离线支持）

### 性能优化

- 文件列表按字母顺序排序，确保哈希计算的一致性
- 排除 `service-worker.js` 本身，避免循环依赖
- 使用流式读取文件内容，避免内存占用过大

## 常见问题

### Q: 为什么更新了文件但 Service Worker 没有更新？

A: 检查以下几点：
1. 确保执行了 `npm run build` 重新构建
2. 在浏览器中强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 在 DevTools 中手动 Unregister Service Worker

### Q: 如何验证缓存是否生效？

A: 
1. 构建并部署应用
2. 打开 Chrome DevTools → Network
3. 勾选 "Offline" 模拟离线环境
4. 刷新页面，如果能正常加载说明缓存生效

### Q: 如何排除某些文件不被缓存？

A: 在 `vite.config.ts` 的 `filesToCache` 过滤逻辑中添加排除条件：

```typescript
const filesToCache = allFiles.filter(file => 
    file !== './service-worker.js' &&
    !file.includes('some-pattern-to-exclude')
);
```

## 相关资源

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA 最佳实践](https://web.dev/progressive-web-apps/)
- [Vite 插件开发](https://vitejs.dev/guide/api-plugin.html)

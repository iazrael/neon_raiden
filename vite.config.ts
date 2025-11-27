import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

import fs from 'fs';

// 读取package.json中的版本号
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
let appVersion = packageJson.version;
const [major, minor] = appVersion.split('.');
const patch = Math.floor(Date.now() / 1000000) % 1000; // 使用当前时间戳后3位作为patch版本（数字）
appVersion = `${major}.${minor}.${patch}`;
const cacheName = `neon-raiden-v${major}.${minor}.${patch}`;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: './',
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            tailwindcss(),
            // 插件：为Service Worker注入版本号
            {
                name: 'version-inject-plugin',
                apply: 'build',
                writeBundle() {
                    // 构建完成后，处理public目录中的service-worker.js
                    const swPath = path.resolve(__dirname, 'dist/service-worker.js');
                    if (fs.existsSync(swPath)) {
                        let swContent = fs.readFileSync(swPath, 'utf-8');
                        swContent = swContent.replace(
                            /__APP_CACHE_NAME__/g,
                            cacheName
                        );
                        fs.writeFileSync(swPath, swContent, 'utf-8');
                        console.log('Service Worker version injected successfully');
                    }
                }
            }
        ],
        define: {
            '__APP_VERSION__': JSON.stringify(appVersion),
            '__APP_VERSION_MAJOR__': JSON.stringify(major),
            '__APP_VERSION_MINOR__': JSON.stringify(minor),
            '__APP_VERSION_PATCH__': JSON.stringify(patch),
            '__APP_CACHE_NAME__': JSON.stringify(cacheName),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});

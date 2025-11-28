import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import { swInjectPlugin } from './vite-plugins/sw-inject-plugin';

// 读取package.json中的版本号
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
let appVersion = packageJson.version;
const [major, minor] = appVersion.split('.');
// 用当前的东八区时间的时分作为patch， hh:MM
const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000); // 东八区时间
const patch = now.getUTCHours().toString().padStart(2, '0') + ':' + now.getUTCMinutes().toString().padStart(2, '0');
appVersion = `${major}.${minor}.${patch}`;

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
            // Service Worker 注入插件
            swInjectPlugin({
                appName: 'neon-raiden',
                version: { major, minor, patch },
            }),
        ],
        define: {
            '__APP_VERSION__': JSON.stringify(appVersion),
            '__APP_VERSION_MAJOR__': JSON.stringify(major),
            '__APP_VERSION_MINOR__': JSON.stringify(minor),
            '__APP_VERSION_PATCH__': JSON.stringify(patch),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';

// 读取package.json中的版本号
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
let appVersion = packageJson.version;
const [major] = appVersion.split('.');
// 用距离2025-01-01的天数作为 minor
const minor = Math.floor((new Date().getTime() - new Date('2025-01-01').getTime()) / (24 * 60 * 60 * 1000)).toString();
// 用当前的东八区时间的时分作为patch， hh:MM
const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000); // 东八区时间
const patch = now.getUTCHours().toString().padStart(2, '0') + now.getUTCMinutes().toString().padStart(2, '0');
appVersion = `${major}.${minor}.${patch}`;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: './',
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        build: {
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'index.html'),
                    // refactor: path.resolve(__dirname, 'refactor.html'),
                }
            }
        },
        plugins: [
            react(),
            tailwindcss(),
            checker({
                typescript: true
            }),
            VitePWA({
                registerType: 'prompt',
                includeAssets: ['favicon.svg', 'logo.svg', 'logo-180.png', 'logo-192.png', 'logo-512.png'],
                manifest: {
                    name: "霓电战记",
                    short_name: "霓电战记",
                    description: "A cyberpunk action game with neon aesthetics",
                    start_url: "./",
                    scope: "./",
                    display: "standalone",
                    orientation: "portrait-primary",
                    background_color: "#0a0a0a",
                    theme_color: "#00ff88",
                    categories: [
                        "games"
                    ],
                    icons: [
                        {
                            src: "./logo.svg",
                            sizes: "any",
                            type: "image/svg+xml",
                            purpose: "any maskable"
                        },
                        {
                            src: "./logo-192.png",
                            sizes: "192x192",
                            type: "image/png",
                            purpose: "any maskable"
                        },
                        {
                            src: "./logo-512.png",
                            sizes: "512x512",
                            type: "image/png",
                            purpose: "any maskable"
                        }
                    ],
                    shortcuts: [
                        {
                            name: "Start Game",
                            short_name: "Play",
                            description: "Start playing Neon Raiden",
                            url: "./?mode=play",
                            icons: [
                                {
                                    src: "./logo-192.png",
                                    sizes: "192x192",
                                    type: "image/png",
                                    purpose: "any maskable"
                                }
                            ]
                        }
                    ],
                    prefer_related_applications: false
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,wav}'],
                    clientsClaim: true,
                    skipWaiting: true,
                    runtimeCaching: [
                    ]
                },
                devOptions: {
                    enabled: true,
                    type: 'module'
                }
            })
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

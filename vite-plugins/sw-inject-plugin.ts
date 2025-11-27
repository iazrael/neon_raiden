import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Plugin } from 'vite';

/**
 * 递归扫描目录，获取所有文件的相对路径
 */
function getAllFiles(dirPath: string, baseDir: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, baseDir, arrayOfFiles);
        } else {
            // 获取相对于baseDir的路径，并转换为URL格式
            const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
            arrayOfFiles.push('./' + relativePath);
        }
    });

    return arrayOfFiles;
}

/**
 * 计算文件内容的哈希值
 */
function calculateFilesHash(files: string[], baseDir: string): string {
    const hash = crypto.createHash('md5');

    // 对文件路径排序以确保一致性
    const sortedFiles = [...files].sort();

    sortedFiles.forEach(file => {
        const filePath = path.join(baseDir, file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath);
            hash.update(content);
        }
    });

    return hash.digest('hex').substring(0, 8);
}

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

/**
 * Service Worker 注入插件
 * 
 * 功能：
 * 1. 自动扫描构建输出目录中的所有文件
 * 2. 计算文件内容哈希，生成唯一的缓存名称
 * 3. 将缓存名称和文件列表注入到 Service Worker 中
 * 
 * @param options 插件配置选项
 * @returns Vite 插件
 */
export function swInjectPlugin(options: SwInjectPluginOptions): Plugin {
    const {
        swFileName = 'service-worker.js',
        appName = 'app',
        version,
        excludePatterns = []
    } = options;

    return {
        name: 'sw-inject-plugin',
        apply: 'build',
        writeBundle() {
            // 构建完成后，扫描dist目录中的所有文件
            const distDir = path.resolve(process.cwd(), 'dist');
            const swPath = path.join(distDir, swFileName);

            if (!fs.existsSync(swPath)) {
                console.warn(`Service Worker file not found: ${swFileName}, skipping injection`);
                return;
            }

            // 获取所有需要缓存的文件
            const allFiles = getAllFiles(distDir, distDir);

            // 排除 service-worker.js 本身和其他指定的文件
            const filesToCache = allFiles.filter(file => {
                // 排除 SW 文件本身
                if (file === `./${swFileName}`) {
                    return false;
                }

                // 排除匹配指定模式的文件
                return !excludePatterns.some(pattern => file.includes(pattern));
            });

            // 计算文件内容哈希
            const filesHash = calculateFilesHash(filesToCache, distDir);

            // 生成带哈希的缓存名称
            const cacheName = `${appName}-v${version.major}.${version.minor}.${version.patch}-${filesHash}`;

            // 读取 service worker 内容
            let swContent = fs.readFileSync(swPath, 'utf-8');

            // 替换缓存名称
            swContent = swContent.replace(
                /__APP_CACHE_NAME__/g,
                cacheName
            );

            // 替换资源列表
            const assetsArray = JSON.stringify(filesToCache, null, 4);
            swContent = swContent.replace(
                /__ASSETS_TO_CACHE__/g,
                assetsArray
            );

            // 写回文件
            fs.writeFileSync(swPath, swContent, 'utf-8');

            console.log(`✓ Service Worker injected successfully`);
            console.log(`  Cache Name: ${cacheName}`);
            console.log(`  Files to cache: ${filesToCache.length}`);
        }
    };
}

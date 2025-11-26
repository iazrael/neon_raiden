// Version management for Neon Raiden
// 版本号在构建时一次性不变，由Vite根据package.json注入

declare const __APP_VERSION__: string;
declare const __APP_VERSION_MAJOR__: string;
declare const __APP_VERSION_MINOR__: string;
declare const __APP_VERSION_PATCH__: string;

export function getVersion(): string {
    return `v${__APP_VERSION__}`;
}

export function getVersionInfo() {
    return {
        major: parseInt(__APP_VERSION_MAJOR__, 10),
        minor: parseInt(__APP_VERSION_MINOR__, 10),
        patch: parseInt(__APP_VERSION_PATCH__, 10),
        full: getVersion()
    };
}

/**
 * 获取缓存名称，应用于Service Worker中
 * 格式: neon-raiden-v{major}.{minor}.{patch}
 */
export function getCacheName(): string {
    return `neon-raiden-${getVersion()}`;
}

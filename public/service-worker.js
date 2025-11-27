// Service Worker缓存配置
// CACHE_NAME和ASSETS_TO_CACHE会在Vite构建时自动注入
// CACHE_NAME: 基于版本号和文件内容哈希生成，确保文件变更时缓存更新
// ASSETS_TO_CACHE: 自动扫描public目录下的所有文件
const CACHE_NAME = '__APP_CACHE_NAME__';
const ASSETS_TO_CACHE = __ASSETS_TO_CACHE__;


// 安装Service Worker
// 当CACHE_NAME版本号更新时，会自动建立新缓存
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.log('Cache addAll error:', err);
            });
        })
    );
    self.skipWaiting();
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 网络请求处理
self.addEventListener('fetch', (event) => {
    // 只处理GET请求
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then((response) => {
                // 不缓存非成功响应
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // 克隆响应
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // 离线时返回缓存的资源
                return caches.match(event.request);
            });
        })
    );
});

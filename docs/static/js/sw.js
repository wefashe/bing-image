/**
 * Service Worker - 完整离线缓存方案
 *
 * 三级缓存策略：
 *   1. App Shell（HTML/CSS/JS/字体）  → 安装时预缓存，Cache-First
 *   2. 动态数据（images.db/stories） → Cache-First，URL 按天版本化，离线回退最近版本
 *   3. Bing CDN 图片                → Cache-First，500 条上限 FIFO 淘汰
 */
const CACHE_VERSION = 3;
const STATIC_CACHE = 'bing-static-v' + CACHE_VERSION;
const DATA_CACHE = 'bing-data-v' + CACHE_VERSION;
const IMG_CACHE = 'bing-img'; // 图片缓存不携带版本号，部署更新时不清空
const MAX_IMG_ITEMS = 500;

// 安装时预缓存 App Shell
const PRECACHE_LIST = [
  './',
  'static/css/w3.css',
  'static/css/index.css',
  'static/css/font-awesome.min.css',
  'static/js/sql-wasm.js',
  'static/js/sql-wasm.wasm',
  'static/js/protect.js',
  'static/js/index.js',
  'static/fonts/fontawesome-webfont.woff2?v=4.7.0',
  'static/img/favicon-3.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_LIST))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== IMG_CACHE && !k.includes('v' + CACHE_VERSION)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bing CDN 图片：Cache-First
  if (url.hostname === 'cn.bing.com') {
    event.respondWith(cacheFirst(IMG_CACHE, event.request, MAX_IMG_ITEMS));
    return;
  }

  // 同源请求才处理
  if (url.origin !== self.location.origin) return;

  // 动态数据：Cache-First（URL 已按天版本化，同天直接命中缓存）
  // 离线时回退匹配无版本号路径，使用最近一次缓存
  if (url.pathname.endsWith('images.db') || url.pathname.endsWith('stories.json')) {
    event.respondWith(cacheFirstData(DATA_CACHE, event.request));
    return;
  }

  // App Shell 静态资源：Cache-First
  event.respondWith(cacheFirst(STATIC_CACHE, event.request));
});

/**
 * Cache-First：缓存命中直接返回，未命中走网络并写入缓存
 */
function cacheFirst(cacheName, request, maxItems) {
  return caches.open(cacheName).then(cache =>
    cache.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          if (maxItems) trimCache(cacheName, maxItems);
        }
        return response;
      });
    })
  );
}

/**
 * Cache-First 数据策略：优先版本化 URL 缓存，离线时回退最近版本
 */
function cacheFirstData(cacheName, request) {
  return caches.open(cacheName).then(cache =>
    cache.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(() => {
        // 离线兜底：匹配同路径无版本号的最近缓存
        const url = new URL(request.url);
        return cache.match(url.origin + url.pathname);
      });
    })
  );
}

/**
 * FIFO 缓存淘汰
 */
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache =>
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    })
  );
}

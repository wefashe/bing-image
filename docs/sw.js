/**
 * Service Worker - 完整离线缓存方案
 *
 * 三级缓存策略：
 *   1. App Shell（HTML/CSS/JS/字体）  → 安装时预缓存，Cache-First
 *   2. 动态数据（images.db/stories） → Network-First，确保每次获取最新数据，离线回退最近版本
 *   3. Bing CDN 图片                → Cache-First，500 条上限 FIFO 淘汰
 */
const CACHE_VERSION = 5;
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

  // 动态数据：Network-First（确保每次获取最新数据，离线回退最近版本）
  if (url.pathname.endsWith('images.db') || url.pathname.endsWith('stories.json')) {
    event.respondWith(networkFirstData(DATA_CACHE, event.request));
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
 * Network-First 数据策略：优先走网络获取最新数据，网络失败时回退缓存
 * 确保每次都能拿到最新的壁纸和故事数据
 */
function networkFirstData(cacheName, request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  return caches.open(cacheName).then(cache =>
    fetch(request).then(response => {
      if (response.ok) {
        // 网络成功，先清理同路径旧版本再写入，避免冗余缓存
        return cache.keys().then(keys =>
          Promise.all(
            keys.filter(k => {
              try { return new URL(k.url).pathname === pathname && k.url !== request.url; } catch(e) { return false; }
            ).map(k => cache.delete(k))
          ).then(() => {
            cache.put(request, response.clone());
            return response;
          })
        );
      }
      return response;
    }).catch(() => {
      // 网络失败，回退到同路径的任意版本缓存
      return cache.keys().then(keys => {
        const match = keys.find(k => {
          try { return new URL(k.url).pathname === pathname; } catch(e) { return false; }
        });
        return match ? cache.match(match) : new Response('', { status: 503 });
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

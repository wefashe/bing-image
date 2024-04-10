/**
 * 图片加载优化
 * 1、压缩图片
 * 2、预加载 了解一下img标签decoding="async" 和 es6 的 promise和prefetch、preload
 * 3、懒加载 也叫按需加载 减少请求压力 下载完成后再加载lazyload，图片可见时再加载postpone
 *          了解一下img标签的loading="lazy"属性 和 es6 的 promise
 * 4、渐进式图片 高画质图像加载完之前会先显示低画质版本 做一个动画，图片从模糊到清晰
 * 5、响应式图片 按设备宽度使用尺寸合适的图片
 * 6、使用 CDN
 * 7、WebP 图像格式 专为 web 优化的图像格式
 * 8、高分屏优化
 * 9、占位图  视觉空白问题  css渐变色背景 为其设置背景色
 * 10、其他，字体图标不如用SVG responsive设计 media query、以及srcset属性、picture元素、src-N、mxhr
 */

const bing_api_prefix = 'https://cn.bing.com';
let pageIndex = 1, pageSize = 24

function readDbFile(callback) {
  let config = {
    locateFile: () => "static/js/sql-wasm.wasm",
  };
  initSqlJs(config).then(function (SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "data/images.db", true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = e => {
      // document.getElementById('me-load').classList.toggle('w3-hide');
      document.getElementById('me-load').classList.add('w3-hide');
      const uInt8Array = new Uint8Array(xhr.response);
      callback(new SQL.Database(uInt8Array));
    };
    xhr.send();
  });
}

readDbFile(function (db) {
  setImage(db, pageIndex, pageSize)
  // 懒加载
  lazyload()
  window.addEventListener('scroll', () => {
    // 获取页面高度
    var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    // 获取滚动高度
    var scrollTop = window.screenY || document.documentElement.scrollTop || document.body.scrollTop;
    // 获取可视区域高度 这个不会变
    var clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    if (scrollHeight - scrollTop - clientHeight < clientHeight / 2) {
      pageIndex++
      setImage(db, pageIndex, pageSize)
    }
    throttle(lazyload, 200)();
    // 当浏览器窗口大小改变时，运行函数
    // window.addEventListener('resize', lazyloader);
    // 当设备的纵横方向改变时，运行函数
    // window.addEventListener('orientationChange', lazyloader);
  }, false);
});

// 图片预加载 小图片加载完成后自动替换，大图片懒加载替换
function preloader(id) {
  if (!id) return;
  var image_obj = document.getElementById(id);
  var dataSrc = image_obj.getAttribute('data-src');
  if (!dataSrc) return;
  var big_image = new Image();
  big_image.src = dataSrc;
}

// 判断一个元素是否在可视区域, 有3种方式
function isVisible(element) {
  // 浏览器视口的高度
  const viewPortHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  // 滚动轴滚动的距离
  const offsetTop = element.offsetTop
  // 图片的头部距离浏览器顶部的高度
  var scrollTop = window.screenY || document.documentElement.scrollTop || document.body.scrollTop;
  // 第一种 offsetTop、scrollTop
  const top = offsetTop - scrollTop
  // const top = element.getBoundingClientRect().top
  // 第二种 getBoundingClientRect
  return top <= viewPortHeight
  // 第三种 Intersection Observer
}

// 图片懒加载 可视区域判断是否加载完成，加载完成后自动替换
function lazyload() {
  // document.querySelectorAll('img.me-lazy[data-src]').forEach(function(img){
  //   let rect = img.getBoundingClientRect();
  //   let visible = rect.top<=window.innerHeight && rect.bottom>=0;
  //   if(!visible){return;}
  //   // 如果元素可见，则替换其 src 的值
  //   img.src = img.dataset.src;
  //   img.classList.remove('lazy');
  // });
  var image_objs = document.querySelectorAll('img[data-src]')
  for (let image_obj of image_objs) {
    var dataSrc = image_obj.getAttribute('data-src')
    if (!dataSrc) continue;
    let visible = isVisible(image_obj);
    if (visible) {
      !function () {
        var big_image = new Image();
        big_image.onload = function () {
          big_image.onload = null;
          image_obj.onload = function () {
            image_obj.onload = null;
            image_obj.removeAttribute('data-src');
          }
          image_obj.src = this.src;
        }
        big_image.src = dataSrc;
      }()
    }
  }
}

// 防抖节流
function throttle(func, wait, immediate) {
  let last = 0, timer = null;
  return function (...args) {
    const now = Date.now();
    const context = this;
    if (now - last < wait && !immediate) {
      // 防抖 用于控制函数触发的频率
      // 两次触发函数的时间小于延迟时间，走防抖逻辑
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = now;
        func.apply(context, args);
      }, wait);
    } else {
      // 节流 触发必须间隔一段时间
      // 函数两次触发事件已经大于延迟，必须要给用户一个反馈，走节流逻辑
      last = now;
      func.apply(context, args);
    }
  };
}

// 图片加载错误的捕获及处理
window.addEventListener("error", function (event) {
  const target = event.target;
  if (target instanceof HTMLImageElement) {
    const curTimes = Number(target.dataset.retryTimes) || 0
    // 重试2次
    if (curTimes >= 2) {
      // 去除，防止滚动重复加载
      target.removeAttribute('lazy-src');
      target.classList.add("me-img-error");
    } else {
      target.dataset.retryTimes = curTimes + 1
      target.src = target.src
    }
  }
}, true);

// 图片下载
function download(url, fileName) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true)
  xhr.responseType = 'blob'
  // 请求成功
  xhr.onload = function () {
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
      blobSaveAsFile(this.response, fileName);
    }
  }
  // 监听下载进度
  xhr.addEventListener('progress', function (e) {
    let percent = Math.trunc(e.loaded / e.total * 100);
    // todo
  });
  // 错误处理
  xhr.addEventListener('error', function (e) {
    // todo
  });
  xhr.send()
}

// 文本下载
function stringSaveAsFile(str, fileName) {
  const blob = new Blob([str], { type: 'text/plain' });
  blobSaveAsFile(blob, fileName);
}

function blobSaveAsFile(blob, fileName) {
  var urlCreator = window.URL || window.webkitURL;
  // 将Blob转化为同源的url
  const imageUrl = urlCreator.createObjectURL(blob);
  const tag = document.createElement('a');
  tag.href = imageUrl;
  tag.download = fileName || ""
  tag.style.display = 'none';
  document.body.appendChild(tag);
  tag.click();
  setTimeout(function () {
    document.body.removeChild(tag);
    tag.remove();
    urlCreator.revokeObjectURL(blob);
  }, 100);
}

function setImage(db, pageIndex, pageSize) {
  var stmt = db.prepare("select * from wallpaper w  order by enddate desc limit $pageSize offset ($pageIndex - 1) * $pageSize");
  stmt.bind({ $pageIndex: pageIndex, $pageSize: pageSize });
  var image_list = document.getElementById('image-list')
  while (stmt.step()) {
    var row = stmt.getAsObject();
    var url = row.url.substring(0, row.url.indexOf('&'));
    var small_img_url = `${bing_api_prefix}${url}&w=120`;
    var big_img_url = `${bing_api_prefix}${url}&w=384&h=216`
    var view_count = Math.floor(Math.random() * (100 - 1000) + 1000);
    // 渐进式图片
    var image_html = `<div class="w3-quarter w3-padding"> 
                          <div class="w3-card w3-round-large me-card">
                            <div class="me-img w3-center">
                              <div class="me-lodding"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>
                              <a href="${bing_api_prefix}${row.copyrightlink}" target="_blank"> 
                                <img id="${row.enddate}" class="w3-image me-lazy" src="${small_img_url}" data-src="${big_img_url}" data-load="0" title="${row.copyright}" alt="${bing_api_prefix}${row.urlbase}" style="width:100%;max-width:100%"> 
                              </a> 
                            </div>
                            <div class = "w3-padding-small">
                              <div class="w3-row w3-padding-small w3-tiny"><i class="fa fa-circle" style="color: #ff5745; font-weight: bold;"></i> 必应壁纸</div>
                              <div class="w3-row w3-padding-small me-img-title" title="${row.title}">${row.title}</div>
                              <div class="w3-row w3-padding-small w3-small me-meta">
                                <div class="w3-left"><i class="fa fa-clock-o"></i> ${row.enddate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")}</div>
                                <div class="w3-right" style="margin-left:12px"><i class="fa fa-heart"></i> ${view_count}</div>
                                <div class="w3-right"><i class="fa fa-eye"></i> ${Math.floor(Math.random() * (view_count - 1000) + 1000)}</div>
                              </div>
                            </div>
                          </div>
                        </div>`
    image_list.innerHTML += image_html;
    // 预加载
    preloader(row.enddate)
  }
}

// TODO 图片预览

// 图片全屏
function keydownHandler(event) {
  // 按空格键
  if (event.code == 'Space') {
    event.preventDefault();
    toggleFullScreen();
  }
  // document.removeEventListener("keydown",keydownHandler,false);
}
// 监听按键
document.addEventListener('keydown', keydownHandler);


function fullscreenchangeHandler(event) {
  // document.removeEventListener("fullscreenchange",fullscreenchangeHandler,fal  se);
}
// 监听全屏
document.addEventListener('fullscreenchange', fullscreenchangeHandler);


function toggleFullScreen() {
  var doc_document = document.documentElement;
  var win_document = window.document;
  // 请求全屏
  var requestFullScreen = doc_document.requestFullscreen || doc_document.mozRequestFullScreen || doc_document.webkitRequestFullScreen || doc_document.msRequestFullscreen;
  // 退出全屏
  var exitFullScreen = win_document.exitFullscreen || win_document.mozCancelFullScreen || win_document.webkitExitFullscreen || win_document.msExitFullscreen;
  // 判断是否全屏
  var isFullscreen = win_document.fullscreenElement || win_document.mozFullScreenElement || win_document.webkitFullscreenElement || win_document.msFullscreenElement

  if (!isFullscreen) {
    // 如果当前不是全屏状态，则进入全屏
    requestFullScreen.call(doc_document);
  } else {
    // 如果当前是全屏状态，则退出全屏
    exitFullScreen.call(win_document);
  }
}





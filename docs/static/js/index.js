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
 * 
 * 页面功能
 * 1、图片列表
 *  1.1 滚动加载  已完成
 *  1.2 图片下载  已完成
 *  2.3 明细预览
 *  2.4 鼠标滑过动画 已完成
 *  2.5 图片加载动画 已完成
 *  2.6 图片加载错误页面 已完成
 *  2.7 首页加载动画 已完成
 *  2.8 滚动下拉加载动画 已完成
 *  2.9 加载db文件获取数据
 *  2.10 页面seo优化
 *  2.11 页面设备响应式
 *  2.12 必应前缀选择
 *  2.13 图片卡片标签优化
 *  2.14 图片标题长度过长显示3个点 已完成
 *  2.15 图片卡片时间显示优化
 * 2、图片预览
 *  2.1 图片切换：
 *    2.1.1 鼠标滚轮滚动 
 *    2.1.2 页面左右按钮，已完成
 *    2.1.3 键盘左右按键，已完成
 *    2.1.4 鼠标左右拖动
 *    2.1.5 鼠标上下拖动关闭预览
 *  2.2 图片大小：
 *    2.2.1 鼠标光标样式及图标样式的切换 已完成
 *    2.2.2 图片放大放小 已完成
 *    2.2.3 图片放大到最大且保持长宽比例
 *    2.2.4 图片放大缩小动画
 *  2.3 图片下载：
 *  2.4 列表和预览同步加载：
 *  2.5 缩略图展示，自动跟随切换：
 *  2.6 焦点放大动画：
 *  2.7 关闭自动跳转对应图片卡片：
 *  2.8 预览界面美化：
 *  2.9 大图片居中展示：已完成
 * 3、图片明细
 *  3.1 今天图片首页展示
 *  3.2 明细界面蒙板
 *  3.3 每日图片明细点击展示
 *  3.4 图片下载，图片标签
 *  3.5 图片定位，图片地图
 *  3.6 图片文字介绍
 *  3.7 今日图片首页展示与顶部菜单的融合
 *  3.8 顶部菜单滚动动画
 * 4、图片查询
 *  4.1 展示存在的所有年月日
 *  4.2 按年、月、日进行过滤查询
 *  4.3 此时禁用滚动查询
 *  4.4 重新进入首页后进行滚动查询
 * 优化部分
 * 1、db文件加载耗时
 * 2、图标字体文件加载耗时
 * 3、Github Actions优化，是否可以直接部署
 */

// 前缀
const bing_api_prefix = 'https://cn.bing.com';
// 分页
let pageIndex = 1, pageSize = 24

// 读取文件
function dbFileGet(callback) {
  let config = {
    locateFile: () => "static/js/sql-wasm.wasm",
  };
  initSqlJs(config).then(function (SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "data/images.db", true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = e => {
      callback(new SQL.Database(new Uint8Array(xhr.response)));
    };
    xhr.send();
  });
};

// 隐藏元素
function hideElementById(elementId, hide) {
  const element = document.getElementById(elementId);
  if (element) {
    if (hide) {
      element.classList.add('w3-hide');
    } else {
      element.classList.remove('w3-hide');
    }
  }
};

// 是否接近底部
function isNearBottom() {
  // 获取页面高度
  var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  // 获取滚动高度
  var scrollTop = window.screenY || document.documentElement.scrollTop || document.body.scrollTop;
  // 获取可视区域高度 这个不会变
  var clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  // 判断是否到屏幕下半部分
  return scrollHeight - scrollTop - clientHeight < clientHeight / 2
}

// 判断一个元素是否在可视区域, 有3种方式
function isViewArea(element) {
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

function loadData(db) {
  var stmt = db.prepare("select * from wallpaper w  order by enddate desc limit $pageSize offset ($pageIndex - 1) * $pageSize");
  stmt.bind({ $pageIndex: pageIndex, $pageSize: pageSize });
  var content = '';
  while (stmt.step()) {
    const row = stmt.getAsObject();
    // 切换超清图片
    const url = row.url.substring(0, row.url.indexOf('&'));
    const uhdUrl = url.replace(url.substring(url.lastIndexOf('_') + 1, url.lastIndexOf('.')), 'UHD');
    // 预览图片
    var viewImg = bing_api_prefix + uhdUrl;
    // 渐进小图
    const insImg = bing_api_prefix + `${uhdUrl}&w=50`;
    // 渐进大图
    const bigImg = bing_api_prefix + `${uhdUrl}&w=384&h=216`;

    const viewCount = Math.floor(Math.random() * (100 - 1000) + 1000);
    const downCount = Math.floor(Math.random() * (100 - viewCount) + 1000);

    // 20210101转为2021-01-01
    const date8 = row.enddate;
    const dateShow = date8.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
    // 2021-01-01转为2021/01/01，2021/01/01字符串格式进行转换兼容性更好
    const dateObj = chinaDate(dateShow.replace(/-/g, "/"));
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    const today = chinaDate();
    const isToday = month == today.getMonth() && day == today.getDate();
    const days = today.getFullYear() - year
    const tags = new Map([
      [0, '必应今日'],
      [1, '去年今日'],
      [2, '前年今日'],
      ['default', '往年今日'],
    ])

    var copyrightlink = row.copyrightlink;
    try {
      var keyCode = new URL(row.copyrightlink).searchParams.get("q");
      // " 双引号用 %22 表示
      copyrightlink = bing_api_prefix + `/search?q=${keyCode}&filters=HpDate:%22${row.startdate}_1600%22`
    } catch (err) {
      copyrightlink = '';
    }

    // 渐进式图片
    content += `
    <div class="w3-col l3 m4 s6 w3-margin-top">
        <div class="w3-card w3-hover-shadow w3-round-large me-card" data-view=${viewImg}>
            <div class="me-list-img w3-center">
                <div class="me-lodding"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>
                <img loading="lazy" decoding="async" data-date="${date8}" class="w3-image me-cursor-pointer me-lazy" src="${insImg}" data-big="${bigImg}" data-title="${row.copyright}" alt="${bing_api_prefix}${row.urlbase}" style="width:100%;max-width:100%">
            </div>
            <div class="w3-auto">
                <div class="w3-row w3-padding-small w3-tiny" >
                    <div class="${isToday ? 'w3-blue' : 'w3-orange'} w3-left w3-padding-small w3-round" style="color: white!important; font-weight: bold;">
                        <i class="fa fa-circle w3-transparent"></i> ${isToday ? tags.get(days) || tags.get('default') : '必应美图'}
                    </div>
                </div>
                <div class="w3-row w3-padding-small me-img-title" title="${row.title}">
                    <a href="${copyrightlink}" target="_blank" ${copyrightlink ? '' : 'onclick="return false" class="me-cursor-default"'}>
                        ${row.title}
                    </a>
                </div>
                <div class="w3-row w3-padding-small w3-small me-meta">
                    <div class="w3-left w3-show-inline-block"><i class="fa fa-clock-o"></i> ${dateShow}</div>
                    <div class="w3-right w3-show-inline-block w3-row-padding">
                        <div class="w3-show-inline-block"><i class="fa fa-eye me-cursor-pointer"></i> <span>${viewCount}</span></div>
                        <div class="w3-show-inline-block w3-hide-medium w3-hide-small"><i class="fa fa-download me-cursor-pointer"></i> <span>${downCount}</span></div>
                    </div>
                </div>
            </div>
        </div >
    </div > `;
  }
  const imageList = document.getElementById('image-list');
  imageList.innerHTML += content;
  pageIndex++;
  if (content.length == 0) {
    pageIndex = 1;
  }
  const childNodes = imageList.childNodes;
  if (childNodes.length < pageSize) {
    // 少于pageSize 时，自动重复补全
    loadData(db)
  }
}

dbFileGet(function (session) {
  hideElementById('me-full-load', true);
  hideElementById('me-bottom-load', true);
  loadData(session)
  lazyload()
  window.addEventListener('scroll', () => {
    // 浏览器滚动触发
    if (isNearBottom()) {
      hideElementById('me-bottom-load', false);
      loadData(session)
    }
    throttle(lazyload, 200)();
  });
});



document.querySelector('#image-list').onclick = (event) => {
  const target = event.target
  if (target.classList.contains('w3-image')) {
    preview(target)
  }
  if (target.classList.contains('fa-download')) {
    download(target, target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-view'), true);
  }
  if (target.classList.contains('fa-eye')) {
    download(target, target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-view'), false);
  }
}


// 图片预加载 小图片加载完成后自动替换，大图片懒加载替换
function preloader(id) {
  if (!id) return;
  var image_obj = document.querySelectorAll(`.me - img img[data - date= '${id}']`)[0];
  var dataSrc = image_obj.getAttribute('data-src');
  if (!dataSrc) return;
  var big_image = new Image();
  big_image.src = dataSrc;
}



// 图片懒加载 可视区域判断是否加载完成，加载完成后自动替换
function lazyload() {
  document.querySelectorAll('img[data-big]').forEach(function (img) {
    if (isViewArea(img)) {
      var image = new Image();
      image.onload = function () {
        image.onload = null;
        img.onload = function () {
          img.onload = null;
          img.removeAttribute('data-big');
        }
        img.src = image.src;
      }
      image.src = img.getAttribute('data-big');
    }
  });
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
      target.removeAttribute('data-big');
      target.classList.add("me-img-error");
      target.classList.remove("me-cursor-pointer");
      target.onclick = null;
    } else {
      target.dataset.retryTimes = curTimes + 1
      target.src = target.src
    }
  }
}, true);

// 图片下载
function download(element, url, download) {
  if (!url) {
    element.classList.remove('me-cursor-pointer');
    element.onclick = null;
    return;
  }
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true)
  xhr.responseType = 'blob'
  // 请求成功
  xhr.onload = function () {
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
      var blob = this.response;
      // 文本下载
      // const blob = new Blob(['你好123'], { type: 'text/plain' });
      // var blob = new Blob([this.response], { type: 'image/png' });
      // if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      //   // 兼容IE/Edge
      //   window.navigator.msSaveOrOpenBlob(blob, fileName)
      // }
      var urlCreator = window.URL || window.webkitURL;
      // 将Blob转化为同源的url
      const imageUrl = urlCreator.createObjectURL(blob);
      const tag = document.createElement('a');
      tag.href = imageUrl;
      if (download) {
        tag.download = url.substring(url.lastIndexOf('id=') + 3, url.length) || ""
      } else {
        tag.target = '_blank';
        // 堵住钓鱼安全漏洞
        tag.rel = 'noopener noreferrer nofollow';
        // 禁用右键和拖拽
        // tag.oncontextmenu = function () {
        //   return false;
        // };
        // tag.ondragstart = function () {
        //   return false;
        // }
      }
      tag.style.display = 'none';
      document.body.appendChild(tag);
      tag.click();
      setTimeout(function () {
        document.body.removeChild(tag);
        tag.remove();
        urlCreator.revokeObjectURL(blob);
        const val = element.nextElementSibling.innerText || '0';
        element.nextElementSibling.innerText = parseInt(val.trim()) + 1
      }, 100);
    } else {
      element.classList.remove('me-cursor-pointer');
      element.classList.add('me-cursor-not-allowed');
      element.onclick = null;
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

function chinaDate(timeString) {
  let time = !timeString ? new Date() : new Date(timeString);
  if (time.toString() === 'Invalid Date') {
    time = new Date();
  }
  // 东八区时差为 +8
  const timezoneOffset = 8;
  // 转为 UTC 时间
  const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
  // 加上时差得到东八区时间
  const chinaDate = new Date(utc + (timezoneOffset * 60 * 60 * 1000));
  return chinaDate;
}

function changeDate(date, days) {
  var date_str = date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
  var date_obj = chinaDate(date_str.replace(/-/g, "/"));
  var year = date_obj.getFullYear();
  var month = date_obj.getMonth() + 1;
  days = days || 0
  var day = date_obj.getDate() + days;
  return year + month.toString().padStart(2, '0') + day.toString().padStart(2, '0')
}

function showImg(date) {
  let imgShowObj = null;
  const bigImgView = document.getElementById('me-big-img-show');
  const bigImgs = bigImgView.getElementsByTagName("img");;
  for (let img_obj of bigImgs) {
    img_obj.classList.add('w3-hide');
    if (img_obj.getAttribute('data-date') == date) {
      imgShowObj = img_obj;
    }
  }
  if (!imgShowObj) {
    const img_obj = document.querySelectorAll(`#image-list img[data-date= '${date}']`)[0];
    imgShowObj = new Image();
    imgShowObj.onload = function () {
      imgShowObj.classList.remove('w3-hide');
    }
    imgShowObj.src = img_obj.src.substring(0, img_obj.src.indexOf('&'));
    imgShowObj.classList.add('w3-hide');
    imgShowObj.setAttribute('data-date', date);
    imgShowObj.classList.add('w3-image');
    imgShowObj.classList.add('w3-animate-opacity');
    bigImgView.appendChild(imgShowObj)
  } else {
    imgShowObj.classList.remove('w3-hide');
  }

}

// 图片预览功能

function preview(img) {
  const view = document.getElementById('me-view')
  view.classList.remove('w3-hide');
  const wheelFunc = function (e) {
    console.log(e.wheelDelta)
    e.preventDefault;
    let n = 0;
    if (e.wheelDelta > 0) {
      n = 1;
    } else if (e.wheelDelta < 0) {
      n = -1;
    } else {
      n = 0;
    }
    if (n == 0) {
      return false;
    }
    plusImg(n);
  };
  const sizeBtn = document.getElementById('me-view-size-btn');
  const sizeIcon = sizeBtn.getElementsByTagName('i')[0];
  const bigImgView = document.getElementById('me-big-img-show');
  const sizeFunc = function () {
    sizeIcon.classList.toggle("fa-search-plus");
    sizeIcon.classList.toggle("fa-search-minus");
    bigImgView.classList.toggle("me-cursor-zoom-in");
    bigImgView.classList.toggle("me-cursor-zoom-out");
    bigImgView.classList.toggle("w3-threequarter");
    bigImgView.classList.toggle("w3-col");
  };

  const closeBtn = document.getElementById('me-view-close-btn')
  const clickFunc = function () {
    view.classList.add('w3-hide');
    sizeIcon.classList.add("fa-search-plus");
    sizeIcon.classList.remove("fa-search-minus");
    bigImgView.classList.add("me-cursor-zoom-in");
    bigImgView.classList.remove("me-cursor-zoom-out");
    bigImgView.classList.add("w3-threequarter");
    bigImgView.classList.remove("w3-col");
    closeBtn.removeEventListener('click', clickFunc);
    sizeBtn.removeEventListener('click', sizeFunc)
    bigImgView.removeEventListener('click', sizeFunc)
    // view.removeEventListener("onmousewheel", wheelFunc);
  };

  closeBtn.addEventListener("click", clickFunc);
  sizeBtn.addEventListener("click", sizeFunc);
  bigImgView.addEventListener("click", sizeFunc);
  // view.addEventListener("mousewheel", wheelFunc);

  const date = img.getAttribute('data-date')
  showImg(date)
}

function plusImg(n) {
  let imgShowObj = null;
  const bigImgView = document.getElementById('me-big-img-show');
  const bigImgs = bigImgView.getElementsByTagName("img");;
  for (let img_obj of bigImgs) {
    if (!img_obj.classList.contains('w3-hide')) {
      imgShowObj = img_obj;
    }
  }

  const slideDate = changeDate(imgShowObj.getAttribute('data-date'), n);
  showImg(slideDate)
}

function currentImg(date) {
  var i;
  var bigImgs = document.getElementsByClassName("me-big-img");
  for (i = 0; i < bigImgs.length; i++) {
    bigImgs[i].style.display = "none";
  }
  var insImgs = document.getElementsByClassName("me-ins-img");
  for (i = 0; i < insImgs.length; i++) {
    insImgs[i].className = insImgs[i].className.replace(" w3-opacity-off", "");
  }
  bigImgs.querySelectorAll(`img[data - date= '${date}']`)[0].style.display = "block";
  insImgs.querySelectorAll(`img[data - date= '${date}']`)[0].className += " w3-opacity-off";
  slideDate = date;
}


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

// 滚动到顶部
document.addEventListener("keydown", function (event) {
  if (event.code == 'ArrowUp') {
    event.preventDefault();
    window.scrollTo({ behavior: "smooth", top: 0 })
  }
});

// 获取真实图片长宽
// myImage.addEventListener('onload', function () {
//   console.log('我的宽度是: ', this.naturalWidth);
//   console.log('我的高度是: ', this.naturalHeight);
// });




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
 * 
 * 获取故事有两个接口：
 * 旧接口 cn.bing.com/cnhp/coverstory?d=YYYYMMDD（2014-20190228）
 * 新接口 cn.bing.com/search?q=1&filters=HpDate:"YYYYMMDD_1600"（20220127后，解析 HTML）
 * https://cn.bing.com/hp/api/model
 */
"use strict";
// 前缀
const bing_api_prefix = 'https://cn.bing.com';
// 分页
let pageIndex = 1, pageSize = 24, year = null, month = null;
let allDataLoaded = false;
// 全局数据库实例，供预览功能查询
let dbSession = null;
// 故事数据
let storiesData = {};

// 读取 stories.json
function loadStories(callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/stories.json', true);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        storiesData = JSON.parse(xhr.responseText);
      } catch (e) {
        storiesData = {};
      }
    }
    if (callback) callback();
  };
  xhr.onerror = function () {
    if (callback) callback();
  };
  xhr.send();
}

// 获取指定日期的故事
function getStory(date) {
  return storiesData[date] || '';
}

// HTML转义，防止XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 在信息栏中显示/隐藏故事
function showStory(infoEl, date) {
  const storyEl = infoEl ? infoEl.querySelector('.me-view-info-story') : null;
  if (!storyEl) return;
  const story = getStory(date);
  if (story) {
    const parts = story.split('\n');
    const desc = parts[0] || '';
    const intro = parts.slice(1).map(line => line.trim()).filter(line => line).join('\n');
    let html = '';
    if (desc) {
      html += '<div class="me-view-story-desc">' + escapeHtml(desc.trim()) + '</div>';
    }
    if (intro) {
      html += '<div class="me-view-story-intro">' + intro.split('\n').map(line => '\u3000\u3000' + escapeHtml(line)).join('\n') + '</div>';
    }
    storyEl.innerHTML = html;
    storyEl.classList.remove('w3-hide');
  } else {
    storyEl.classList.add('w3-hide');
  }
}

// 读取文件
function dbFileGet(callback) {
  let config = {
    locateFile: () => "static/js/sql-wasm.wasm",
  };
  initSqlJs(config).then(function (SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "data/images.db", true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(new SQL.Database(new Uint8Array(xhr.response)));
      } else {
        hideElementById('me-full-load', true);
        showToast('数据库加载失败，请刷新页面重试');
      }
    };
    xhr.onerror = function () {
      hideElementById('me-full-load', true);
      showToast('网络错误，请刷新页面重试');
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
  var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  // 获取可视区域高度 这个不会变
  var clientHeight = window.innerHeight || document.documentElement.clientHeight;
  // 判断是否到屏幕下半部分
  return scrollHeight - scrollTop - clientHeight < clientHeight / 2
}

// 判断一个元素是否在可视区域, 有3种方式
function isViewArea(element) {
  // 浏览器视口的高度
  const viewPortHeight = document.body.clientHeight || document.documentElement.clientHeight || window.innerHeight;
  // 滚动轴滚动的距离
  const offsetTop = element.offsetTop
  // 图片的头部距离浏览器顶部的高度
  var scrollTop = document.body.scrollTop || document.documentElement.scrollTop || window.screenY;
  // 第一种 offsetTop、scrollTop
  const top = offsetTop - scrollTop
  // const top = element.getBoundingClientRect().top
  // 第二种 getBoundingClientRect
  return top <= viewPortHeight
  // 第三种 Intersection Observer
}

function loadData(db) {
  var yearParam = year ? year.replace(/[^\d]/g, '') : null;
  var monthParam = month ? month.replace(/[^\d]/g, '') : null;
  // 用范围查询替代 substring 函数，确保索引生效
  var conditions = '';
  if (yearParam && monthParam) {
    conditions = ' and enddate >= "' + yearParam + monthParam + '01" and enddate <= "' + yearParam + monthParam + '31"';
  } else if (yearParam) {
    conditions = ' and enddate >= "' + yearParam + '0101" and enddate < "' + (parseInt(yearParam) + 1) + '0101"';
  }
  var stmt = db.prepare(`select enddate, startdate, url, urlbase, copyright, copyrightlink, title from wallpaper w where 1 = 1 ${conditions}
  order by enddate desc limit $pageSize offset($pageIndex - 1) * $pageSize`);
  stmt.bind({ $pageIndex: pageIndex, $pageSize: pageSize });
  var content = '';
  // 循环外缓存不变的值，避免重复创建
  const today = chinaDate();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const todayYear = today.getFullYear();
  const dateReg = /^(\d{4})(\d{2})(\d{2})$/;
  const tags = new Map([
    [0, '必应今日'],
    [1, '去年今日'],
    [2, '前年今日'],
    ['default', '往年今日'],
  ]);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    // 切换超清图片
    const index = row.url.indexOf('&');
    var url = row.url;
    if (index != -1) {
      url = url.substring(0, index);
    }
    // 图片不存在时默认显示LaDigue_UHD.jpg
    url += "&rf=LaDigue_1920x1080.jpg";
    const uhdUrl = url.replace(url.substring(url.lastIndexOf('_') + 1, url.lastIndexOf('.')), '1920x1080');
    // 预览图片
    var viewImg = bing_api_prefix + uhdUrl;
    // 渐进小图
    const insImg = bing_api_prefix + `${uhdUrl}&w=50`;
    // 渐进大图
    const bigImg = bing_api_prefix + `${uhdUrl}&w=384&h=216`;

    // Math.floor(Math.random()*(max-min+1))+min  生成 [ min, max ] 范围内的随机整数（大于等于min，小于等于max）
    const downCount = Math.floor(Math.random() * (1000 - 100 + 1) + 100);
    const viewCount = Math.floor(Math.random() * (1000 - downCount + 1) + downCount);

    // 20210101转为2021-01-01
    const date8 = row.enddate;
    const dateShow = date8.replace(dateReg, "$1-$2-$3");
    // 2021-01-01转为2021/01/01，2021/01/01字符串格式进行转换兼容性更好
    const dateObj = chinaDate(dateShow.replace(/-/g, "/"));
    const imgYear = dateObj.getFullYear();
    const imgMonth = dateObj.getMonth();
    const imgDay = dateObj.getDate();

    const isToday = imgMonth == todayMonth && imgDay == todayDay;
    const days = todayYear - imgYear;

    var copyrightlink = row.copyrightlink;
    try {
      var keyCode = new URL(row.copyrightlink).searchParams.get("q");
      // " 双引号用 %22 表示
      copyrightlink = bing_api_prefix + `/search?q=${keyCode}&filters=HpDate:%22${row.startdate}_1600%22`
    } catch (err) {
      copyrightlink = '';
    }

    var title = row.title;
    var copyright = row.copyright;
    if (copyright) {
      title = copyright.substring(0, copyright.indexOf('，', 0)) || copyright;
      if (title.indexOf(' ', 0) > 0) {
        title = title.substring(0, title.indexOf(' ', 0))
      }
    }
    title = title.replace(/^[\s,，]+|[\s,，]+$/g, '');

    if (pageIndex == 1 && content.length == 0) {
      const todayShow = document.getElementById('me-today-show');
      var img = new Image();
      img.onload = function () {
        img.onload = null;
        todayShow.classList.add('me-img-complete');
      };
      img.src = viewImg;
      todayShow.style.backgroundImage = "url(" + viewImg + "), url(" + bigImg + "), url(" + insImg + ")";
      // 更新首页信息栏
      const todayInfo = document.getElementById('me-today-info');
      if (todayInfo) {
        todayInfo.querySelector('.me-view-info-title').textContent = row.title || '';
        todayInfo.querySelector('.me-view-info-date').textContent = dateShow;
        todayInfo.querySelector('.me-view-info-copyright').textContent = row.copyright || '';
        showStory(todayInfo, date8);
        todayInfo.classList.remove('w3-hide');
      }
    }

    // 渐进式图片
    content += `
    <div class="w3-col l3 m4 s6 w3-margin-top">
        <div class="w3-card w3-hover-shadow w3-round-large me-card">
            <div class="me-list-img w3-center">
                <div class="me-lodding"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>
                <img loading="lazy" decoding="async" data-date="${date8}" class="w3-image me-cursor-pointer me-lazy" src="${insImg}" data-big="${bigImg}" data-title="${escapeHtml(row.copyright)}" alt="${bing_api_prefix}${row.urlbase}" style="width:100%;max-width:100%">
            </div>
            <div class="w3-auto">
                <div class="w3-row w3-padding-small w3-tiny" >
                    <div class="${isToday ? 'w3-blue' : 'w3-orange'} w3-left w3-padding-small w3-round" style="color: white!important; font-weight: bold;">
                        <i class="fa fa-circle w3-transparent"></i> ${isToday ? tags.get(days) || tags.get('default') : '必应美图'}
                    </div>
                </div>
                <div class="w3-row w3-padding-small me-img-title" title="${escapeHtml(title)}">
                    <a href="${escapeHtml(copyrightlink)}" target="_blank" ${copyrightlink ? '' : 'onclick="return false" class="me-cursor-default"'}>
                        ${escapeHtml(title)}
                    </a>
                </div>
                <div class="w3-row w3-padding-small w3-small me-meta">
                    <div class="w3-left w3-show-inline-block"><i class="fa fa-clock-o"></i> ${dateShow}</div>
                    <div class="w3-right w3-show-inline-block w3-row-padding">
                        <div class="w3-show-inline-block"><i class="fa fa-eye"></i> <span>${viewCount}</span></div>
                        <div class="w3-show-inline-block w3-hide-medium w3-hide-small"><i class="fa fa-download me-cursor-pointer" data-view=${viewImg}></i> <span class="me-download-count">${downCount}</span></div>
                    </div>
                </div>
            </div>
        </div >
    </div > `;
  }
  if (content.length == 0) {
    if (pageIndex == 1) {
      document.getElementById('image-list').innerHTML = '';
      content = '<div class="w3-center">没有图片了</div>';
    }
    hideElementById('me-bottom-load', true);
    allDataLoaded = true;
  } else {
    hideElementById('me-bottom-load', false);
  }
  if (content.length == 0) {
    return;
  }
  const imageList = document.getElementById('image-list');
  // 用appendChild代替innerHTML不会进行image-list元素全局重新渲染
  imageList.appendChild(document.createRange().createContextualFragment(content));
  pageIndex++;
}

loadStories(function () {
  dbFileGet(function (session) {
  dbSession = session;
  // 初始化懒加载观察器
  initLazyObserver();
  const years = session.exec("select distinct substr(enddate,1,4) year from wallpaper order by enddate desc");
  if (years.length > 0) {
    const values = years[0]['values'];
    if (values.length > 0) {
      var content = '';
      for (let year of values) {
        content += `<div class="w3-bar-item w3-button w3-round w3-small" >${year[0]}</div>`;
      }
      const yearList = document.getElementById('me-year-list');
      yearList.appendChild(document.createRange().createContextualFragment(content));
    }
  }
  document.querySelector('#me-filter').onclick = (event) => {
    const target = event.target
    if (target.classList.contains('w3-red')) {
      return
    }
    if (target.classList.contains('w3-button')) {
      var childrenNodes = target.parentNode.children;
      for (let node of childrenNodes) {
        node.classList.remove('w3-red');
        node.classList.remove('w3-hover-red');
      }
      target.classList.add('w3-red');
      target.classList.add('w3-hover-red');
      year = document.querySelector('#me-year-list > .w3-red')?.innerText;
      if (year == '全部') {
        year = null;
      }
      month = document.querySelector('#me-month-list > .w3-red')?.innerText;
      if (month == '全部') {
        month = null;
      }
      document.getElementById('image-list').innerHTML = '';
      pageIndex = 1;
      allDataLoaded = false;
      loadData(session);
      lazyload();
    }
  }
  document.getElementById('me-history-btn').onclick = function () {
    const filter = document.getElementById('me-filter');
    var allcount = 0;
    const dateObj = chinaDate();
    const year_str = dateObj.getFullYear().toString();
    const month_str = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    filter.querySelectorAll('.w3-button').forEach(function (node) {
      if (!filter.classList.contains('w3-hide')) {
        if (node.innerText == '全部') {
          if (node.classList.contains('w3-red')) {
            allcount += 1;
          } else {
            node.classList.add('w3-red');
            node.classList.add('w3-hover-red');
          }
        } else {
          node.classList.remove('w3-red');
          node.classList.remove('w3-hover-red');
        }
      } else {
        if (node.innerText == year_str || node.innerText == month_str) {
          if (node.classList.contains('w3-red')) {
            allcount += 1;
          } else {
            node.classList.add('w3-red');
            node.classList.add('w3-hover-red');
          }
        } else {
          node.classList.remove('w3-red');
          node.classList.remove('w3-hover-red');
        }
      }
    });
    if (allcount != 2) {
      if (!filter.classList.contains('w3-hide')) {
        year = null;
        month = null;
      } else {
        year = year_str;
        month = month_str;
      }
      document.getElementById('image-list').innerHTML = '';
      pageIndex = 1;
      allDataLoaded = false;
      loadData(session);
      lazyload();
    }
    filter.classList.toggle('w3-hide');
    this.classList.toggle('w3-text-red');
    localStorage.setItem('filter', filter.classList.contains('w3-hide') ? '0' : '1');
  }

  hideElementById('me-full-load', true);
  hideElementById('me-bottom-load', false);

  const savedFilter = localStorage.getItem('filter')
  if (savedFilter === '1') {
    const filterEl = document.getElementById('me-filter');
    filterEl.classList.remove('w3-hide');
    document.getElementById('me-history-btn').classList.toggle('w3-text-red');
    var allcount = 0;
    const dateObj = chinaDate();
    const year_str = dateObj.getFullYear().toString();
    const month_str = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    filterEl.querySelectorAll('.w3-button').forEach(function (node) {
      if (node.innerText == year_str || node.innerText == month_str) {
        if (node.classList.contains('w3-red')) {
          allcount += 1;
        } else {
          node.classList.add('w3-red');
          node.classList.add('w3-hover-red');
        }
      } else {
        node.classList.remove('w3-red');
        node.classList.remove('w3-hover-red');
      }
    });
    if (allcount != 2) {
      year = year_str;
      month = month_str;
      document.getElementById('image-list').innerHTML = '';
      pageIndex = 1;
      allDataLoaded = false;
      loadData(session);
      lazyload();
    }
  } else {
    allDataLoaded = false;
    loadData(session)
    lazyload()
  }
  // 加载更多按钮只绑定一次
  const loadMoreBtn = document.querySelector('#me-bottom-load-btn .w3-button');
  if (loadMoreBtn) {
    loadMoreBtn.onclick = function () {
      hideElementById('me-bottom-load-btn', true);
      hideElementById('me-bottom-loading', false);
      loadData(session)
      lazyload()
      hideElementById('me-bottom-loading', true);
    }
  }
  // 节流函数只创建一次，避免每次滚动都新建实例
  const throttledScroll = throttle(function () {
    const height = document.getElementById('me-today-show').clientHeight;
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop || window.screenY;
    var menu = document.getElementById('me-menu')
    // 导航栏随滚动渐显：滚过20%开始渐显，滚过60%完全显示
    var menuRatio = Math.min(1, Math.max(0, (scrollTop - height * 0.2) / (height * 0.4)));
    if (menuRatio > 0) {
      menu.style.opacity = 0.1 + menuRatio * 0.8;
      menu.style.pointerEvents = 'auto';
      menu.style.background = 'var(--theme-background, white)';
    } else {
      menu.style.opacity = '0';
      menu.style.pointerEvents = 'none';
      menu.style.background = '';
    }
    // 首页信息栏随滚动渐隐：滚过20%开始渐隐，滚过60%完全消失
    var todayInfo = document.getElementById('me-today-info');
    if (todayInfo && !todayInfo.classList.contains('w3-hide')) {
      var ratio = Math.min(1, Math.max(0, (scrollTop - height * 0.2) / (height * 0.4)));
      todayInfo.style.opacity = 1 - ratio;
    }
    // 浏览器滚动触发（数据全部加载完后跳过）
    if (!allDataLoaded && pageIndex <= 2) {
      if (isNearBottom() && !(pageIndex == 1 && year && month)) {
        hideElementById('me-bottom-loading', false);
        loadData(session)
        hideElementById('me-bottom-loading', true);
      }
    }
    // 加载更多按钮显示逻辑
    if (pageIndex > 2) {
      hideElementById('me-bottom-load-btn', false);
    }
    // 懒加载也合并到同一个滚动监听
    lazyload();
  }, 200);
  window.addEventListener('scroll', throttledScroll);
  });
});

document.querySelector('#image-list').onclick = (event) => {
  const target = event.target
  if (target.classList.contains('w3-image')) {
    preview(target)
  }
  if (target.classList.contains('fa-download')) {
    download(target, target.getAttribute('data-view'), true);
  }
}

function imgBigShow(img) {
  var image = new Image();
  image.onload = function () {
    image.onload = null;
    img.onload = function () {
      img.onload = null;
      img.removeAttribute('data-big');
      img.classList.add('me-img-complete');
    }
    img.src = image.src;
  }
  image.onerror = function () {
    image.onerror = null;
    // 大图加载失败，移除标记让错误处理接管
    img.removeAttribute('data-big');
    img.classList.add('me-img-complete');
  }
  image.src = img.getAttribute('data-big');
}

// IntersectionObserver 懒加载
let lazyObserver = null;
function initLazyObserver() {
  if (lazyObserver || !('IntersectionObserver' in window)) return;
  lazyObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        lazyObserver.unobserve(img);
        if (img.complete) {
          imgBigShow(img);
        } else {
          img.onload = function () {
            img.onload = null;
            imgBigShow(img);
          }
        }
      }
    });
  }, { rootMargin: '200px 0px' });
}

// 图片懒加载：注册观察或回退到手动检测
function lazyload() {
  var lazyImgs = document.querySelectorAll('img[data-big]');
  if (lazyObserver) {
    lazyImgs.forEach(function (img) { lazyObserver.observe(img); });
  } else {
    lazyImgs.forEach(function (img) {
      if (isViewArea(img)) {
        if (img.complete) {
          imgBigShow(img)
        } else {
          img.onload = function () {
            img.onload = null;
            imgBigShow(img)
          }
        }
      }
    });
  }
}

// 节流：固定间隔内最多执行一次
function throttle(func, wait) {
  let last = 0, timer = null;
  return function (...args) {
    const now = Date.now();
    const context = this;
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      // 间隔已过，立即执行
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      func.apply(context, args);
    } else {
      // 间隔未过，确保最后一次触发也能执行（尾随调用）
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = Date.now();
        func.apply(context, args);
        timer = null;
      }, remaining);
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
      var urlCreator = window.URL || window.webkitURL;
      // 将Blob转化为同源的url
      const imageUrl = urlCreator.createObjectURL(blob);
      const tag = document.createElement('a');
      tag.href = imageUrl;
      if (download) {
        tag.download = url.substring(url.indexOf('=') + 1, url.indexOf('&')) || ""
      } else {
        tag.target = '_blank';
        tag.rel = 'noopener noreferrer nofollow';
      }
      tag.style.display = 'none';
      document.body.appendChild(tag);
      tag.click();
      setTimeout(function () {
        document.body.removeChild(tag);
        tag.remove();
        urlCreator.revokeObjectURL(imageUrl);
        // 卡片上的下载计数（预览下载时跳过）
        if (element.nextElementSibling && element.nextElementSibling.classList.contains('me-download-count')) {
          const val = element.nextElementSibling.innerText || '0';
          element.nextElementSibling.innerText = parseInt(val.trim()) + 1
        }
      }, 100);
    } else {
      element.classList.remove('me-cursor-pointer');
      element.classList.add('me-cursor-not-allowed');
      element.onclick = null;
    }
  }
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
  // 纯日期加减，无需时区转换
  var y = parseInt(date.substring(0, 4));
  var m = parseInt(date.substring(4, 6));
  var d = parseInt(date.substring(6, 8));
  var dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dt.getFullYear() + (dt.getMonth() + 1).toString().padStart(2, '0') + dt.getDate().toString().padStart(2, '0');
}

// 记录当前预览显示的日期
let currentPreviewDate = null;
let currentPreviewDirection = 1; // 1=上一张(时间更早), -1=下一张(时间更新)
// 当前预览图片的UHD下载地址
let currentPreviewDownloadUrl = null;

// 数据库日期边界缓存
let dbMinDate = null;
let dbMaxDate = null;

function getDbBounds() {
  if (!dbSession) return;
  if (dbMinDate && dbMaxDate) return;
  const result = dbSession.exec("select min(enddate), max(enddate) from wallpaper");
  if (result.length > 0 && result[0].values.length > 0) {
    dbMinDate = result[0].values[0][0];
    dbMaxDate = result[0].values[0][1];
  }
}

function showImg(date) {
  const bigImgView = document.getElementById('me-big-img-show');
  const bigImgs = bigImgView.getElementsByTagName("img");

  // 通过数据库判断目标日期是否存在壁纸
  getDbBounds();
  if (dbMinDate && date < dbMinDate) {
    showToast('没有更早的壁纸了');
    return;
  }
  if (dbMaxDate && date > dbMaxDate) {
    showToast('没有更新的壁纸了');
    return;
  }

  // 查数据库获取该日期的图片信息
  let rowData = null;
  if (dbSession) {
    const stmt = dbSession.prepare("select enddate, startdate, url, urlbase, copyright, copyrightlink, title from wallpaper where enddate = ? limit 1");
    stmt.bind([date]);
    if (stmt.step()) {
      rowData = stmt.getAsObject();
    }
    stmt.free();
  }

  // 如果目标日期没有壁纸，向同方向查找最近的有数据的日期
  if (!rowData && dbSession && currentPreviewDirection !== 0) {
    const dir = currentPreviewDirection > 0 ? 'asc' : 'desc';
    const op = currentPreviewDirection > 0 ? '>' : '<';
    const nearStmt = dbSession.prepare(`select enddate, startdate, url, urlbase, copyright, copyrightlink, title from wallpaper where enddate ${op} ? order by enddate ${dir} limit 1`);
    nearStmt.bind([date]);
    if (nearStmt.step()) {
      rowData = nearStmt.getAsObject();
    }
    nearStmt.free();
    if (rowData) {
      date = rowData.enddate;
    }
  }

  if (!rowData) {
    showToast(currentPreviewDirection > 0 ? '没有更早的壁纸了' : '没有更新的壁纸了');
    return;
  }

  // 构造UHD最高清下载地址
  const dlIndex = rowData.url.indexOf('&');
  let dlUrl = dlIndex != -1 ? rowData.url.substring(0, dlIndex) : rowData.url;
  dlUrl += "&rf=LaDigue_UHD.jpg";
  const dlUhdUrl = dlUrl.replace(dlUrl.substring(dlUrl.lastIndexOf('_') + 1, dlUrl.lastIndexOf('.')), 'UHD');
  currentPreviewDownloadUrl = bing_api_prefix + dlUhdUrl;

  // 隐藏所有已显示的图
  for (let img_obj of bigImgs) {
    img_obj.classList.add('w3-hide');
  }

  // 切换图片时先隐藏信息栏，等图片加载完再显示
  const viewInfo = document.getElementById('me-view-info');
  if (viewInfo) viewInfo.classList.add('w3-hide');

  // 检查是否已缓存该图
  let existInBig = null;
  for (let img_obj of bigImgs) {
    if (img_obj.getAttribute('data-date') == date) {
      existInBig = img_obj;
    }
  }

  if (existInBig && existInBig.parentNode === bigImgView) {
    existInBig.classList.remove('w3-hide');
    // 缓存图片立即显示信息栏
    if (viewInfo && rowData) {
      const dateShow = date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
      viewInfo.querySelector('.me-view-info-title').textContent = rowData.title || '';
      viewInfo.querySelector('.me-view-info-date').textContent = dateShow;
      viewInfo.querySelector('.me-view-info-copyright').textContent = rowData.copyright || '';
      showStory(viewInfo, date);
      viewInfo.classList.remove('w3-hide');
    }
  } else {
    // 限制预览缓存图片数量，防止内存泄漏
    var imgs = bigImgView.querySelectorAll('img[data-date]');
    if (imgs.length >= 10) {
      for (var i = 0; i < imgs.length - 5; i++) {
        if (imgs[i].classList.contains('w3-hide')) {
          imgs[i].onload = null;
          imgs[i].onerror = null;
          imgs[i].remove();
        }
      }
    }
    // 从数据库数据构造图片URL
    const index = rowData.url.indexOf('&');
    let url = index != -1 ? rowData.url.substring(0, index) : rowData.url;
    url += "&rf=LaDigue_1920x1080.jpg";
    const uhdUrl = url.replace(url.substring(url.lastIndexOf('_') + 1, url.lastIndexOf('.')), '1920x1080');
    const viewUrl = bing_api_prefix + uhdUrl;

    const newImg = new Image();
    // 显示加载动画
    const lodding = bigImgView.querySelector('.me-lodding');
    if (lodding) lodding.classList.remove('w3-hide');
    newImg.onload = function () {
      newImg.classList.remove('w3-hide');
      newImg.onload = null;
      if (lodding) lodding.classList.add('w3-hide');
      // 图片加载完成后显示信息栏
      if (viewInfo && rowData) {
        const dateShow = date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
        viewInfo.querySelector('.me-view-info-title').textContent = rowData.title || '';
        viewInfo.querySelector('.me-view-info-date').textContent = dateShow;
        viewInfo.querySelector('.me-view-info-copyright').textContent = rowData.copyright || '';
        showStory(viewInfo, date);
        viewInfo.classList.remove('w3-hide');
      }
    }
    newImg.onerror = function () {
      newImg.classList.remove('w3-hide');
      newImg.classList.add('me-img-error');
      newImg.onerror = null;
      if (lodding) lodding.classList.add('w3-hide');
    }
    newImg.src = viewUrl;
    newImg.classList.add('w3-hide');
    newImg.setAttribute('data-date', date);
    newImg.classList.add('w3-image');
    bigImgView.appendChild(newImg);
  }
  currentPreviewDate = date;
}

// 轻量提示
function showToast(msg) {
  let toast = document.getElementById('me-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'me-toast';
    toast.className = 'me-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('me-toast-show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('me-toast-show');
  }, 1500);
}

// 图片预览功能

function preview(img) {
  const view = document.getElementById('me-view')
  view.classList.remove('w3-hide');
  // 锁定页面滚动，记录并保持滚动位置
  const scrollY = window.scrollY;
  document.documentElement.classList.add('me-no-scroll');
  document.body.classList.add('me-no-scroll');
  document.body.style.top = `-${scrollY}px`;

  const wheelFunc = function (e) {
    e.preventDefault();
    e.stopPropagation();
    let n = 0;
    if (e.wheelDelta > 0) {
      n = 1;
    } else if (e.wheelDelta < 0) {
      n = -1;
    }
    if (n == 0) return;
    plusImg(n);
  };

  const sizeBtn = document.getElementById('me-view-size-btn');
  const sizeIcon = sizeBtn.getElementsByTagName('i')[0];
  const bigImgView = document.getElementById('me-big-img-show');
  const sizeFunc = function () {
    sizeIcon.classList.toggle("fa-search-plus");
    sizeIcon.classList.toggle("fa-search-minus");
    bigImgView.classList.toggle("w3-threequarter");
    bigImgView.classList.toggle("w3-col");
  };

  const closeBtn = document.getElementById('me-view-close-btn')
  const downloadBtn = document.getElementById('me-view-download-btn')
  const downloadFunc = function () {
    if (currentPreviewDownloadUrl) {
      download(downloadBtn, currentPreviewDownloadUrl, true);
    }
  };
  const clickFunc = function () {
    view.classList.add('w3-hide');
    // 隐藏信息栏
    const viewInfo = document.getElementById('me-view-info');
    if (viewInfo) viewInfo.classList.add('w3-hide');
    // 重置预览为正常模式
    if (!bigImgView.classList.contains('w3-threequarter')) {
      bigImgView.classList.add('w3-threequarter');
      bigImgView.classList.remove('w3-col');
    }
    if (!sizeIcon.classList.contains('fa-search-plus')) {
      sizeIcon.classList.add('fa-search-plus');
      sizeIcon.classList.remove('fa-search-minus');
    }
    // 清理预览缓存图片的事件引用，防止内存泄漏
    var cachedImgs = bigImgView.querySelectorAll('img[data-date]');
    cachedImgs.forEach(function (img) { img.onload = null; img.onerror = null; });
    // 恢复页面滚动
    document.documentElement.classList.remove('me-no-scroll');
    document.body.classList.remove('me-no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
    closeBtn.removeEventListener('click', clickFunc);
    sizeBtn.removeEventListener('click', sizeFunc);
    bigImgView.removeEventListener('click', sizeFunc);
    downloadBtn.removeEventListener('click', downloadFunc);
    view.removeEventListener('wheel', wheelFunc);
    document.removeEventListener('keydown', previewKeyHandler);
  };

  // 预览时键盘左右切换图片
  const previewKeyHandler = function (e) {
    if (e.code === 'Escape') {
      e.preventDefault();
      clickFunc();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      plusImg(1);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      plusImg(-1);
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
    } else if (e.code === 'Space') {
      e.preventDefault();
    }
  };

  closeBtn.addEventListener("click", clickFunc);
  sizeBtn.addEventListener("click", sizeFunc);
  bigImgView.addEventListener("click", sizeFunc);
  downloadBtn.addEventListener("click", downloadFunc);
  // 监听滚轮事件，阻止冒泡并切换图片
  view.addEventListener('wheel', wheelFunc, { passive: false });
  document.addEventListener('keydown', previewKeyHandler);

  const date = img.getAttribute('data-date')
  currentPreviewDate = date;
  showImg(date)
}

function plusImg(n) {
  let imgShowObj = null;
  const bigImgView = document.getElementById('me-big-img-show');
  const bigImgs = bigImgView.getElementsByTagName("img");
  for (let img_obj of bigImgs) {
    if (!img_obj.classList.contains('w3-hide')) {
      imgShowObj = img_obj;
    }
  }
  if (!imgShowObj) return;

  const slideDate = changeDate(imgShowObj.getAttribute('data-date'), n);
  if (slideDate) {
    currentPreviewDirection = n;
    showImg(slideDate)
  }
}



// 图片全屏
function keydownHandler(event) {
  if (event.code == 'Space') {
    event.preventDefault();
    toggleFullScreen();
  }
}
// 监听按键
document.addEventListener('keydown', keydownHandler);


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

function checkDark() {
  const dark = localStorage.getItem('dark')
  if (dark) {
    if (dark === '1') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.getElementById('me-theme-btn').classList.remove('fa-moon-o')
      document.getElementById('me-theme-btn').classList.add('fa-sun-o');
    }
  } else {
    // 不存在暗色模式标识符情况下，是否需要启用暗色模式
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // 媒体查询，用户系统是否启动暗色模式
      document.documentElement.setAttribute('data-theme', 'dark')
      document.getElementById('me-theme-btn').classList.remove('fa-moon-o')
      document.getElementById('me-theme-btn').classList.add('fa-sun-o');
    } else if (matchMedia('(prefers-color-scheme: light)').matches) {
      // 媒体查询，用户系统是否启动亮色模式
      document.documentElement.removeAttribute('data-theme')
      document.getElementById('me-theme-btn').classList.remove('fa-sun-o')
      document.getElementById('me-theme-btn').classList.add('fa-moon-o');
    } else if (chinaDate().getHours() >= 21 || chinaDate().getHours() < 7) {
      // 媒体查询不支持或未指定，使用时间判断，是不是到点了
      document.documentElement.setAttribute('data-theme', 'dark')
      document.getElementById('me-theme-btn').classList.remove('fa-moon-o')
      document.getElementById('me-theme-btn').classList.add('fa-sun-o');
    }
  }
}
checkDark();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  checkDark();
});


function swithDark() {
  const dark = localStorage.getItem('dark')
  if (dark) {
    if (dark === '1') {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('dark', '0');
      document.getElementById('me-theme-btn').classList.remove('fa-sun-o')
      document.getElementById('me-theme-btn').classList.add('fa-moon-o');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('dark', '1');
      document.getElementById('me-theme-btn').classList.remove('fa-moon-o')
      document.getElementById('me-theme-btn').classList.add('fa-sun-o');
    }
  } else {
    if (document.documentElement.hasAttribute('data-theme')) {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('dark', '0');
      document.getElementById('me-theme-btn').classList.remove('fa-sun-o')
      document.getElementById('me-theme-btn').classList.add('fa-moon-o');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('dark', '1');
      document.getElementById('me-theme-btn').classList.remove('fa-moon-o')
      document.getElementById('me-theme-btn').classList.add('fa-sun-o');
    }
  }
}

document.getElementById('me-theme-btn').onclick = function () {
  swithDark()
};

// 悼念日网站变灰
function mourningDay(dates) {
  const today = chinaDate();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  for (var i = 0; i < dates.length; i++) {
    if (month + '-' + date == dates[i]) {
      document.documentElement.classList.add('me-gray')
      break;
    }
  }
}

mourningDay([
  '4-4', '12-13'
])

// 设置版权年份
var copyrightYear = document.getElementById('me-copyright-year');
if (copyrightYear) {
  copyrightYear.innerHTML = 'Copyright &copy; 2021-' + new Date().getFullYear() +
    ' by <a href="https://github.com/wefashe/bing-image" target="_blank" style="cursor: auto;">wefashe</a>. All Rights Reserved.';
}
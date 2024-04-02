const bing_api_prefix = 'https://cn.bing.com';
let pageIndex = 1, pageSize = 36
        
function readDbFile(callback) {
  let config = {
    locateFile: () => "static/js/sql-wasm.wasm",
  };
  initSqlJs(config).then(function (SQL) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', "static/db/images.db", true);
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

readDbFile(function(db){
  setImage(db,pageIndex,pageSize)
  // 懒加载
  lazyload()
  window.addEventListener('scroll', () => {
      // 获取页面高度
      var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      // 获取滚动高度
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      // 获取可视区域高度 这个不会变
      var clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
      if (scrollHeight - scrollTop - clientHeight < clientHeight/2 ){
        pageIndex ++
        setImage(db,pageIndex,pageSize)
      }
      throttle(lazyload, 200)();
  }, false);
});

// 图片预加载 小图片加载完成后自动替换，大图片懒加载替换
function preloader(id, small_src, big_src){
  if(!small_src)return;
  var small_image = new Image();
  small_image.src = small_src;
  small_image.style.width = '100%';
  function imageComplete(e_id, s_src, b_src){
    
    var image_obj = document.getElementById(e_id)
    image_obj.src = s_src

    var a = image_obj.parentNode
    a.classList.remove('w3-hide')

    var big_image = new Image();
    big_image.src = b_src;
    big_image.style.width = '100%';
  }
  if(small_image.complete) {  
    imageComplete(id, small_src, big_src)
  }
  small_image.onload = function(){
    imageComplete(id, small_src, big_src)
  }

}

// 图片懒加载 可视区域判断是否加载完成，加载完成后自动替换
function lazyload() {
  var images = document.querySelectorAll('img[data-src]')
  for (let image of images) {
    if (!image.dataset.src) return
    var clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (image.offsetTop < clientHeight + scrollTop){
      let src =  image.dataset.src
      if(!src)return;

      var big_image = new Image();
      big_image.src = src;
      big_image.style.width = '100%';
      if(big_image.complete) {  
        image.src = src;
      }
      big_image.onload = function() {  
        image.src = src;
      }  
      // 判断图片是否加载完成
      if(image.complete) {  
        image.removeAttribute('data-src')
      }
      image.onload = function() {  
        image.removeAttribute('data-src')
      }  
    }
  }
}

// 防抖节流
function throttle(func, wait, immediate){
  let last = 0, timer = null;
  return function(...args) {
      const now = Date.now();
      const context = this;
      if (now - last < wait && !immediate) {
        // 防抖 用于控制函数触发的频率
        // 两次触发函数的时间小于延迟时间，走防抖逻辑
        clearTimeout(timer);
        timer = setTimeout(function() {
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
        target.removeAttribute('data-src');
        target.classList.add("me-img-error");
      } else {
        target.dataset.retryTimes = curTimes + 1
        target.src = target.src
      }
    }
}, true);

// 图片下载
function download(url, fileName){
  const xhr = new XMLHttpRequest();
  xhr.open('GET',url, true)
  xhr.responseType = 'blob'
  // 请求成功
  xhr.onload = function () {
    if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
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
function stringSaveAsFile(str, fileName){
    const blob = new Blob([str], { type: 'text/plain' });
    blobSaveAsFile(blob, fileName);
}

function blobSaveAsFile(blob, fileName){
    var urlCreator = window.URL || window.webkitURL;
    // 将Blob转化为同源的url
    const imageUrl = urlCreator.createObjectURL(blob);
    const tag = document.createElement('a');
    tag.href = imageUrl;
    tag.download = fileName || ""
    tag.style.display = 'none';
    document.body.appendChild(tag);
    tag.click();
    setTimeout(function(){
      document.body.removeChild(tag);
      tag.remove();
      urlCreator.revokeObjectURL(blob);
    }, 100);
}

function setImage(db, pageIndex, pageSize){
  var stmt = db.prepare("select * from wallpaper w  order by enddate desc limit ($pageIndex * $pageSize), $pageSize");
  stmt.bind({ $pageIndex: pageIndex, $pageSize: pageSize });
  var image_list = document.getElementById('image-list')
  while (stmt.step()) {
      var row = stmt.getAsObject();  
      var url = row.url.substring(0,row.url.indexOf('&'));
      var small_img_url = `${bing_api_prefix}${url}&w=120`;
      var big_img_url = `${bing_api_prefix}${url}&w=384&h=216`   
      var view_count = Math.floor(Math.random()*(100 - 1000) + 1000);
      // 渐进式图片
      var image_html = `<div class="w3-quarter w3-padding"> 
                          <div class="w3-card w3-round-large me-card">
                            <div class="me-img">
                              <div class="me-lodding"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>
                              <a class="w3-hide" href="${bing_api_prefix}${row.copyrightlink}" target="_blank"> 
                                <img id="${row.enddate}" class="me-img w3-image" src="${small_img_url}" data-src="${big_img_url}"  title="${row.copyright}" alt="${bing_api_prefix}${row.urlbase}" loading="lazy" style="width:100%;max-width:100%"> 
                              </a> 
                            </div>
                            <div class = "w3-padding-small">
                              <div class="w3-row w3-padding-small w3-tiny"><i class="fa fa-circle" style="color: #ff5745; font-weight: bold;"></i> 必应壁纸</div>
                              <div class="w3-row w3-padding-small me-img-title" title="${row.title}">${row.title}</div>
                              <div class="w3-row w3-padding-small w3-small me-meta">
                                <div class="w3-left"><i class="fa fa-clock-o"></i> ${row.enddate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")}</div>
                                <div class="w3-right" style="margin-left:12px"><i class="fa fa-heart"></i> ${view_count}</div>
                                <div class="w3-right"><i class="fa fa-eye"></i> ${Math.floor(Math.random()*(view_count - 1000) + 1000)}</div>
                              </div>
                            </div>
                          </div>
                        </div>`
      image_list.innerHTML += image_html;  
      // 预加载
      preloader(row.enddate, small_img_url, big_img_url)
  }
}


function keydownHandler(event){
    // 按空格键
    if (event.code == 'Space') {
      event.preventDefault();
      toggleFullScreen(); 
    }
    // document.removeEventListener("keydown",keydownHandler,false);
}
// 监听按键
document.addEventListener('keydown', keydownHandler);


function fullscreenchangeHandler(event){
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





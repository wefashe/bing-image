// 图片预加载

// 图片懒加载
function lazyload() {
  var images = document.querySelectorAll('img[data-src]')
  for (let image of images) {
    if (!image.dataset.src) return
    var clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (image.offsetTop < clientHeight + scrollTop){
      let src =  image.dataset.src
      if(src){
        image.src = image.dataset.src
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
      target.classList.add("me-img-error");
    }
}, true );

function imgloading(oImg) {
  var n = 0;
  var timer = setInterval(function () {
      n++;
      oImg.style.opacity = n / 100;
      if (n >= 100) {
          clearInterval(timer);
      }
      ;
  }, 5);
};

function setImage(db, pageIndex, pageSize){
  var stmt = db.prepare("select * from wallpaper w  order by enddate desc limit ($pageIndex * $pageSize), $pageSize");
  stmt.bind({ $pageIndex: pageIndex, $pageSize: pageSize });
  var image_list = document.getElementById('image-list')
  while (stmt.step()) {
      var row = stmt.getAsObject();  
      var small_img_url = `https://cn.b111ing.com${row.url.substring(0,row.url.indexOf('&')) + '&w=120'}`   
      var big_img_url = `https://cn.b111ing.com${row.url.substring(0,row.url.indexOf('&')) + '&w=384&h=216'}`  
      // 预加载
      var image_small_obj = new Image()
      image_small_obj.src = small_img_url
      var image_big_obj = new Image()
      image_big_obj.src = big_img_url 
      // 渐进式图片
      var image_html = `<div class="w3-quarter w3-padding"> 
                          <div class="w3-card w3-round me-card">
                            <div class="me-img">
                              <a href = "https://cn.bing.com${row.copyrightlink}" target="_blank"> 
                                <img class="me-img w3-image" src="${small_img_url}" data-src="${big_img_url}" title="${row.copyright}" alt="https://cn.bing.com${row.urlbase}" style="width:100%;max-width:100%"> 
                              </a> 
                            </div>
                            <div class = "w3-padding-small">
                              <div class="w3-row w3-padding-small w3-tiny"><i class="fa fa-instagram fa-lg fa-fw" style="color: orange; font-weight: bold;"></i> 必应美图</div>
                              <div class="w3-row w3-padding-small me-img-title">${row.title}</div>
                              <div class="w3-row w3-padding-small w3-small me-meta">
                                <div class="w3-left">${row.enddate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")}</div>
                                <div class="w3-right" style="margin-left:12px"><i class="fa fa-heart"></i> ${Math.floor(Math.random()*(100 - 1000) + 1000)}</div>
                                <div class="w3-right"><i class="fa fa-eye"></i> ${Math.floor(Math.random()*(100 - 1000) + 1000)}</div>
                              </div>
                            </div>
                          </div>
                        </div>`
      image_list.innerHTML += image_html;  
  }
}
let config = {
    locateFile: () => "static/js/sql-wasm.wasm",
};
let pageIndex = 1, pageSize = 36
initSqlJs(config).then(function (SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "static/db/images.db", true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = e => {
        const uInt8Array = new Uint8Array(xhr.response);
        const db = new SQL.Database(uInt8Array);
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
    };
    xhr.send(); 
});







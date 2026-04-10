// 调试模式或搜索引擎爬虫，不执行保护脚本
const isBot = /bot|crawl|spider|slurp|mediapartners|google|bing|baidu|sogou|duckduckgo|yandex|teoma/i.test(navigator.userAgent);
const isDebugMode = new URLSearchParams(location.search).get('debug') === 'true';
const _log = isDebugMode ? console.log : function(){};
_log('[Protect] isBot:', isBot, '| isDebugMode:', isDebugMode, '| UA:', navigator.userAgent);
if (isBot || isDebugMode) {
  _log('[Protect] 已跳过所有保护逻辑');
} else {
  // 禁止调试
  (() => {
    let detected = false;
    function block() {
      if (detected) return;
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        detected = true;
        window.__debugDetected = true;
        document.body.innerHTML = "";
        var msg = document.createElement("div");
        msg.style.cssText = "display:flex;justify-content:center;align-items:center;min-height:100vh;font-size:18px;color:#e74c3c;font-family:sans-serif;text-align:center;padding:20px;";
        msg.textContent = "检测到非法调试,请关闭后刷新重试!";
        document.body.appendChild(msg);
        // 持续检测，关闭调试工具后自动刷新
        var checkTimer = setInterval(function () {
          if (window.outerHeight - window.innerHeight <= 200 && window.outerWidth - window.innerWidth <= 200) {
            clearInterval(checkTimer);
            location.reload();
          }
        }, 1000);
      }
    }
    const timer = setInterval(() => {
      (function () {
        return false;
      }
      ['constructor']('debugger')
      ['call']());
    }, 4000);
    // 页面不可见时暂停检测，节省性能
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearInterval(timer);
      }
    });
    try {
      block();
    } catch (err) { }
  })();

  // 禁止右键菜单
  document.oncontextmenu = function () {
    return false;
  };

  // 禁止F12、ctrl+shift+i打开控制台，禁用shift+f10打开右键
  document.onkeydown = function (e) {
    if (e.code === 'F12' || e.ctrlKey && e.shiftKey && e.code === 'KeyI' || e.shiftKey && e.code === 'F10') {
      return false;
    }
  };

  // 禁止复制
  document.oncopy = function (e) {
    return false;
  }

  // 禁止粘贴
  document.onpaste = function (e) {
    return false;
  }

  // 屏蔽剪切
  document.oncut = function (e) {
    return false;
  }

  // 禁止选中
  document.onselectstart = function (e) {
    return false;
  }

  // 禁止鼠标拖动
  document.ondragstart = function (e) {
    return false;
  }

  // 禁止鼠标拖动选中
  document.onselect = function (e) {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    return false;
  }

} // end isBot guard



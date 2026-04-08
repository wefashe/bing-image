修改：

CSS 新增 html.me - no - scroll { overflow - y: hidden!important; }
JS 在预览打开 / 关闭时同步对 document.documentElement（即 < html >）添加 / 移除 me - no - scroll 类// 禁止调试
  (() => {
    function block() {
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        document.body.innerHTML = "检测到非法调试,请关闭后刷新重试!";
      }
      setInterval(() => {
        (function () {
          return false;
        }
        ['constructor']('debugger')
        ['call']());
      }, 50);
    }
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



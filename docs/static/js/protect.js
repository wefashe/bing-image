// 禁止调试
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

// 禁止F12快捷键
document.onkeydown = function (e) {
  if (e.code === 'F12') {
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

// 禁止鼠标拖动
document.onselect = function (e) {
  document.selection.empty();
  return false;
}



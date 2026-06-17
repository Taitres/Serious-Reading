window.Stealth = {
  _bossKeyListener: null,
  _mouseEdgeListener: null,
  _doubleClickListener: null,
  _rightClickTimer: null,
  init: function() {
    var settings = Storage.getSettings();
    this._setupKeyboard(settings);
    this._setupMouseActions(settings);
  },
  _setupKeyboard: function(settings) {
    var self = this;
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (Disguise.isDisguised()) {
          Disguise.hide();
          self._restoreReadingContent();
        } else {
          Disguise.show();
        }
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.ctrlKey && e.key === '`') {
        Disguise.toggle();
        if (!Disguise.isDisguised()) self._restoreReadingContent();
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        self._cycleDisguiseTemplate();
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        ChapterManager.prevChapter();
        if (typeof Reader !== 'undefined') Reader.render();
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        ChapterManager.nextChapter();
        if (typeof Reader !== 'undefined') Reader.render();
        e.preventDefault();
      }
    });
  },
  _setupMouseActions: function(settings) {
    var self = this;
    document.addEventListener('wheel', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
        self._adjustOpacity(e.deltaY > 0 ? -0.05 : 0.05);
      }
    }, { passive: false });
    if (settings.mouseAction === 'doubleclick') {
      document.addEventListener('dblclick', function(e) {
        if (e.target.closest('#reader-toolbar')) {
          Disguise.toggle();
          if (!Disguise.isDisguised()) self._restoreReadingContent();
        }
      });
    } else if (settings.mouseAction === 'click') {
      document.addEventListener('click', function(e) {
        if (e.target.closest('#reader-toolbar')) {
          Disguise.toggle();
          if (!Disguise.isDisguised()) self._restoreReadingContent();
        }
      });
    }
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      self._showQuickMenu(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function(e) {
      if (settings.mouseEdgeAction === 'none') return;
      var edgeSize = 5;
      var isEdge = e.clientX <= edgeSize || e.clientX >= window.innerWidth - edgeSize ||
                   e.clientY <= edgeSize || e.clientY >= window.innerHeight - edgeSize;
      if (isEdge && settings.mouseEdgeAction === 'toggle') {
        Disguise.toggle();
        if (!Disguise.isDisguised()) self._restoreReadingContent();
      }
    });
  },
  _adjustOpacity: function(delta) {
    var settings = Storage.getSettings();
    settings.opacity = Math.max(0.1, Math.min(1.0, (settings.opacity || 1.0) + delta));
    Storage.saveSettings(settings);
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      readerContent.style.opacity = settings.opacity;
    }
  },
  _cycleDisguiseTemplate: function() {
    var templates = ['vscode', 'excel', 'outlook', 'terminal', 'colorpick'];
    var current = Disguise.getMode();
    var idx = templates.indexOf(current);
    var next = templates[(idx + 1) % templates.length];
    Disguise.setMode(next);
    if (Disguise.isDisguised()) {
      Disguise.hide();
      Disguise.show();
    }
  },
  _showQuickMenu: function(x, y) {
    var existing = document.querySelector('.stealth-quick-menu');
    if (existing) existing.remove();
    var menu = document.createElement('div');
    menu.className = 'stealth-quick-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    var items = [
      { label: '切换伪装', action: function() { Disguise.toggle(); if (!Disguise.isDisguised()) Stealth._restoreReadingContent(); } },
      { label: 'VS Code 模式', action: function() { Disguise.setMode('vscode'); Disguise.show(); } },
      { label: 'Excel 模式', action: function() { Disguise.setMode('excel'); Disguise.show(); } },
      { label: 'Outlook 模式', action: function() { Disguise.setMode('outlook'); Disguise.show(); } },
      { label: '终端模式', action: function() { Disguise.setMode('terminal'); Disguise.show(); } },
      { label: '取色背景', action: function() { ColorPicker.pickColor(); } },
      { label: '截图背景', action: function() { ColorPicker.captureBackground(); } },
      { label: '透明度 +', action: function() { Stealth._adjustOpacity(0.1); } },
      { label: '透明度 -', action: function() { Stealth._adjustOpacity(-0.1); } }
    ];
    items.forEach(function(item) {
      var btn = document.createElement('div');
      btn.className = 'quick-menu-item';
      btn.textContent = item.label;
      btn.addEventListener('click', function() {
        item.action();
        menu.remove();
      });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    setTimeout(function() {
      document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }, { once: true });
    }, 100);
  },
  _restoreReadingContent: function() {
    if (typeof Reader !== 'undefined') {
      Reader.render();
    }
  }
};

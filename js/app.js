window.App = {
  init: function() {
    Storage;
    ChapterManager;
    Disguise.init();
    ColorPicker.init();
    Stealth.init();
    Reader.init();
    this._bindWelcomeActions();
    this._bindToolbarActions();
    this._loadRecentList();
    var self = this;
    if (typeof utools !== 'undefined') {
      utools.onPluginEnter(function(action) {
        self._handlePluginEnter(action);
      });
      utools.onPluginOut(function() {
        Reader._saveScrollPosition();
      });
    }
    if (window._ipcRenderer) {
      window._ipcRenderer.on('close-reader', function(event, state) {
        var book = ChapterManager.getBook();
        if (book && state) {
          Storage.saveBookProgress(book.filePath, {
            chapterIndex: state.chapterIndex,
            scrollPosition: state.scrollPosition,
            timestamp: Date.now()
          });
        }
      });
    }
  },
  _handlePluginEnter: function(action) {
    if (action.code === 'reader') {
      this._showView('welcome');
    } else if (action.code === 'reader_continue') {
      var history = Storage.getReadingHistory();
      if (history.length > 0) {
        this._openBook(history[0].filePath, history[0].format);
        Reader.restoreProgress(history[0].filePath);
      }
    } else if (action.code === 'reader_stealth') {
      Disguise.toggle();
      if (!Disguise.isDisguised()) Reader.render();
    } else if (action.code === 'reader_open') {
      if (action.type === 'file' && action.payload && action.payload.length > 0) {
        var file = action.payload[0];
        this._openBook(file.path, file.name.split('.').pop().toLowerCase());
      }
    }
  },
  _showView: function(viewName) {
    document.getElementById('welcome').style.display = viewName === 'welcome' ? 'flex' : 'none';
    document.getElementById('reader-view').style.display = viewName === 'reader' ? 'flex' : 'none';
    if (viewName === 'reader' && typeof utools !== 'undefined') {
      utools.setExpendHeight(500);
    }
  },
  _openBook: function(filePath, format) {
    var book = null;
    if (format === 'epub') {
      if (typeof window.services !== 'undefined' && window.services.readEpub) {
        book = window.services.readEpub(filePath);
      }
    } else {
      var content = '';
      if (typeof window.services !== 'undefined' && window.services.readFile) {
        content = window.services.readFile(filePath);
      }
      if (content) {
        book = Parser.parseFile(filePath, content);
      }
    }
    if (book) {
      ChapterManager.load(book);
      this._showView('reader');
      Reader.applySettings();
      Reader.render();
    }
  },
  _openUrl: function(url) {
    if (typeof window.services !== 'undefined' && window.services.fetchUrl) {
      window.services.fetchUrl(url).then(function(html) {
        var book = Parser.parseOnline(html, url);
        if (book) {
          ChapterManager.load(book);
          App._showView('reader');
          Reader.applySettings();
          Reader.render();
        }
      }).catch(function(err) {
        alert('无法获取网页内容: ' + err.message);
      });
    }
  },
  _bindWelcomeActions: function() {
    var self = this;
    var btnOpen = document.getElementById('btn-open-file');
    if (btnOpen) {
      btnOpen.addEventListener('click', function() {
        if (typeof utools !== 'undefined' && utools.showOpenDialog) {
          var files = utools.showOpenDialog({
            filters: [{ name: '阅读文件', extensions: ['txt', 'epub', 'md', 'markdown'] }],
            properties: ['openFile']
          });
          if (files && files.length > 0) {
            var filePath = files[0];
            var ext = filePath.split('.').pop().toLowerCase();
            self._openBook(filePath, ext);
          }
        }
      });
    }
    var btnUrl = document.getElementById('btn-open-url');
    if (btnUrl) {
      btnUrl.addEventListener('click', function() {
        var url = prompt('请输入网址:');
        if (url && url.trim()) {
          self._openUrl(url.trim());
        }
      });
    }
    var btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
      var history = Storage.getReadingHistory();
      if (history.length > 0) {
        btnContinue.style.display = 'inline-block';
        btnContinue.textContent = '继续: ' + history[0].title;
        btnContinue.addEventListener('click', function() {
          self._openBook(history[0].filePath, history[0].format);
          Reader.restoreProgress(history[0].filePath);
        });
      }
    }
  },
  _bindToolbarActions: function() {
    var self = this;
    var btnSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnSidebar) {
      btnSidebar.addEventListener('click', function() {
        var sidebar = document.getElementById('chapter-sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
      });
    }
    var btnDisguise = document.getElementById('btn-disguise');
    if (btnDisguise) {
      btnDisguise.addEventListener('click', function() {
        Disguise.toggle();
        if (!Disguise.isDisguised()) Reader.render();
      });
    }
    var btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', function() {
        self._showSettingsPanel();
      });
    }
    var btnPopout = document.getElementById('btn-popout');
    if (btnPopout) {
      btnPopout.addEventListener('click', function() {
        self._popoutWindow();
      });
    }
  },
  _loadRecentList: function() {
    var recentList = document.getElementById('recent-list');
    if (!recentList) return;
    var history = Storage.getReadingHistory();
    if (history.length === 0) return;
    var html = '<h3 style="margin-bottom: 8px; font-size: 14px; color: #999;">最近阅读</h3>';
    history.slice(0, 5).forEach(function(item) {
      html += '<div class="recent-item" data-path="' + item.filePath + '" data-format="' + item.format + '">';
      html += '<span>' + item.title + '</span>';
      html += '<span style="font-size: 11px; color: #666;">' + new Date(item.lastRead).toLocaleDateString() + '</span>';
      html += '</div>';
    });
    recentList.innerHTML = html;
    recentList.querySelectorAll('.recent-item').forEach(function(el) {
      el.addEventListener('click', function() {
        App._openBook(this.dataset.path, this.dataset.format);
        Reader.restoreProgress(this.dataset.path);
      });
    });
  },
  _showSettingsPanel: function() {
    var existing = document.querySelector('.settings-panel');
    if (existing) { existing.remove(); return; }
    var settings = Storage.getSettings();
    var panel = document.createElement('div');
    panel.className = 'settings-panel';
    panel.innerHTML =
      '<div class="settings-content">' +
      '<h3>设置</h3>' +
      '<div class="setting-row"><label>字体大小</label><input type="range" id="set-fontsize" min="12" max="28" value="' + settings.fontSize + '"><span id="set-fontsize-val">' + settings.fontSize + '</span></div>' +
      '<div class="setting-row"><label>行间距</label><input type="range" id="set-lineheight" min="1.2" max="3.0" step="0.1" value="' + settings.lineHeight + '"><span id="set-lineheight-val">' + settings.lineHeight + '</span></div>' +
      '<div class="setting-row"><label>主题</label><select id="set-theme"><option value="light"' + (settings.theme === 'light' ? ' selected' : '') + '>白色</option><option value="green"' + (settings.theme === 'green' ? ' selected' : '') + '>护眼绿</option><option value="dark"' + (settings.theme === 'dark' ? ' selected' : '') + '>夜间黑</option></select></div>' +
      '<div class="setting-row"><label>默认伪装</label><select id="set-disguise"><option value="vscode"' + (settings.defaultDisguise === 'vscode' ? ' selected' : '') + '>VS Code</option><option value="excel"' + (settings.defaultDisguise === 'excel' ? ' selected' : '') + '>Excel</option><option value="outlook"' + (settings.defaultDisguise === 'outlook' ? ' selected' : '') + '>Outlook</option><option value="terminal"' + (settings.defaultDisguise === 'terminal' ? ' selected' : '') + '>终端</option></select></div>' +
      '<div class="setting-row"><label>鼠标动作</label><select id="set-mouse"><option value="doubleclick"' + (settings.mouseAction === 'doubleclick' ? ' selected' : '') + '>双击</option><option value="click"' + (settings.mouseAction === 'click' ? ' selected' : '') + '>单击</option><option value="none"' + (settings.mouseAction === 'none' ? ' selected' : '') + '>无</option></select></div>' +
      '<div class="setting-row"><label>自动翻页(秒)</label><input type="number" id="set-autopage" min="0" max="60" value="' + (settings.autoPageSize || 0) + '"><small>0=关闭</small></div>' +
      '<div class="setting-actions"><button id="set-bookmark">添加书签</button><button id="set-save">保存</button><button id="set-close">关闭</button></div>' +
      '</div>';
    document.body.appendChild(panel);
    document.getElementById('set-fontsize').addEventListener('input', function() {
      document.getElementById('set-fontsize-val').textContent = this.value;
    });
    document.getElementById('set-lineheight').addEventListener('input', function() {
      document.getElementById('set-lineheight-val').textContent = this.value;
    });
    document.getElementById('set-save').addEventListener('click', function() {
      settings.fontSize = parseInt(document.getElementById('set-fontsize').value);
      settings.lineHeight = parseFloat(document.getElementById('set-lineheight').value);
      settings.theme = document.getElementById('set-theme').value;
      settings.defaultDisguise = document.getElementById('set-disguise').value;
      settings.mouseAction = document.getElementById('set-mouse').value;
      settings.autoPageSize = parseInt(document.getElementById('set-autopage').value);
      Storage.saveSettings(settings);
      Disguise.setMode(settings.defaultDisguise);
      Reader.applySettings();
      if (settings.autoPageSize > 0) {
        Reader.startAutoPage(settings.autoPageSize * 1000);
      } else {
        Reader.stopAutoPage();
      }
      panel.remove();
    });
    document.getElementById('set-close').addEventListener('click', function() { panel.remove(); });
    document.getElementById('set-bookmark').addEventListener('click', function() { Reader.addBookmark(); panel.remove(); });
  },
  _popoutWindow: function() {
    if (typeof utools === 'undefined' || !utools.createBrowserWindow) return;
    var book = ChapterManager.getBook();
    if (!book) { alert('请先打开一本书'); return; }
    var currentChapter = ChapterManager.getCurrentIndex();
    var settings = Storage.getSettings();
    var state = {
      filePath: book.filePath,
      format: book.format,
      chapterIndex: currentChapter,
      scrollPosition: document.getElementById('reader-content') ? document.getElementById('reader-content').scrollTop : 0,
      settings: settings
    };
    var win = utools.createBrowserWindow(
      'reader.html',
      {
        width: 600,
        height: 800,
        title: '',
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: true,
        backgroundColor: '#00000000',
        skipTaskbar: true,
        webPreferences: {
          preload: 'reader_preload.js'
        }
      },
      function() {
        win.webContents.send('reading-state', state);
        try { win.setAlwaysOnTop(true, 'screen-saver'); } catch(e) {}
      }
    );
  }
};

document.addEventListener('DOMContentLoaded', function() {
  App.init();
});

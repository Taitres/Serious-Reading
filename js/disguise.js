window.Disguise = {
  _currentMode: null,
  _isDisguised: false,
  _templates: ['vscode', 'excel', 'outlook', 'terminal', 'colorpick', 'custom'],
  init: function() {
    this._currentMode = Storage.getSettings().defaultDisguise || 'vscode';
  },
  toggle: function() {
    if (this._isDisguised) {
      this.hide();
    } else {
      this.show();
    }
    return this._isDisguised;
  },
  show: function() {
    var readerContent = document.getElementById('reader-content');
    var readerMain = document.getElementById('reader-main');
    if (!readerContent) return;
    this._isDisguised = true;
    document.body.classList.add('disguised');
    document.body.classList.add('disguise-' + this._currentMode);
    switch (this._currentMode) {
      case 'vscode': this._applyVsCode(readerContent, readerMain); break;
      case 'excel': this._applyExcel(readerContent, readerMain); break;
      case 'outlook': this._applyOutlook(readerContent, readerMain); break;
      case 'terminal': this._applyTerminal(readerContent, readerMain); break;
      case 'colorpick': this._applyColorPick(readerContent, readerMain); break;
      case 'custom': this._applyCustom(readerContent, readerMain); break;
    }
  },
  hide: function() {
    this._isDisguised = false;
    document.body.classList.remove('disguised');
    this._templates.forEach(function(t) {
      document.body.classList.remove('disguise-' + t);
    });
    var readerContent = document.getElementById('reader-content');
    var readerMain = document.getElementById('reader-main');
    if (readerMain) {
      readerMain.style.cssText = '';
    }
    if (readerContent) {
      readerContent.style.cssText = '';
      readerContent.className = '';
    }
    var disguiseOverlays = document.querySelectorAll('.disguise-overlay');
    disguiseOverlays.forEach(function(el) { el.remove(); });
  },
  setMode: function(mode) {
    if (this._isDisguised) {
      this.hide();
    }
    this._currentMode = mode;
  },
  getMode: function() {
    return this._currentMode;
  },
  isDisguised: function() {
    return this._isDisguised;
  },
  _applyVsCode: function(content, main) {
    content.style.background = '#1e1e1e';
    content.style.color = '#d4d4d4';
    content.style.fontFamily = '"Cascadia Code", "Fira Code", "Consolas", monospace';
    content.style.fontSize = '14px';
    content.style.lineHeight = '1.6';
    content.style.padding = '0';
    var html = '<div class="vscode-editor">';
    html += '<div class="vscode-tabs"><div class="vscode-tab active">' + (ChapterManager.getCurrentChapter() ? ChapterManager.getCurrentChapter().title : 'untitled') + '.js</div></div>';
    html += '<div class="vscode-line-numbers">';
    var text = content.innerText || '';
    var lines = text.split('\n');
    lines.forEach(function(line, i) {
      html += '<div class="vscode-line"><span class="vscode-ln">' + (i + 1) + '</span><span class="vscode-code">' + line.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span></div>';
    });
    html += '</div></div>';
    content.innerHTML = html;
    content.classList.add('vscode-content');
    this._addStatusBar(main);
  },
  _applyExcel: function(content, main) {
    content.style.background = '#ffffff';
    content.style.color = '#000000';
    content.style.fontFamily = '"Calibri", "Arial", sans-serif';
    content.style.fontSize = '12px';
    content.style.lineHeight = '1.4';
    content.style.padding = '0';
    var html = '<div class="excel-toolbar"><span class="excel-formula">fx</span><input class="excel-formula-input" readonly value=""></div>';
    html += '<table class="excel-grid"><tbody>';
    var text = content.innerText || '';
    var paragraphs = text.split(/\n+/).filter(function(p) { return p.trim(); });
    var cols = 4;
    paragraphs.forEach(function(p, i) {
      if (i % cols === 0) html += '<tr>';
      html += '<td>' + p.trim().substring(0, 50) + '</td>';
      if (i % cols === cols - 1 || i === paragraphs.length - 1) {
        var remaining = cols - (i % cols) - 1;
        for (var j = 0; j < remaining; j++) html += '<td></td>';
        html += '</tr>';
      }
    });
    html += '</tbody></table>';
    var chapters = ChapterManager.getChapterList();
    html += '<div class="excel-sheets">';
    chapters.forEach(function(ch, i) {
      html += '<span class="excel-sheet' + (i === ChapterManager.getCurrentIndex() ? ' active' : '') + '" data-chapter="' + i + '">' + ch.title.substring(0, 10) + '</span>';
    });
    html += '</div>';
    content.innerHTML = html;
    content.classList.add('excel-content');
  },
  _applyOutlook: function(content, main) {
    content.style.background = '#ffffff';
    content.style.color = '#333333';
    content.style.fontFamily = '"Segoe UI", "Arial", sans-serif';
    content.style.fontSize = '14px';
    content.style.lineHeight = '1.6';
    content.style.padding = '0';
    var chapters = ChapterManager.getChapterList();
    var current = ChapterManager.getCurrentChapter();
    var html = '<div class="outlook-layout">';
    html += '<div class="outlook-mail-list">';
    chapters.forEach(function(ch, i) {
      html += '<div class="outlook-mail-item' + (i === ChapterManager.getCurrentIndex() ? ' active' : '') + '" data-chapter="' + i + '">';
      html += '<div class="outlook-mail-from">' + ch.title + '</div>';
      html += '<div class="outlook-mail-preview">' + (ch.title || '') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="outlook-mail-body">';
    html += '<div class="outlook-mail-header"><strong>Subject:</strong> ' + (current ? current.title : '') + '</div>';
    html += '<div class="outlook-mail-content">';
    var text = content.innerText || '';
    html += text.split(/\n+/).filter(function(p) { return p.trim(); }).map(function(p) { return '<p>' + p.trim() + '</p>'; }).join('');
    html += '</div></div></div>';
    content.innerHTML = html;
    content.classList.add('outlook-content');
  },
  _applyTerminal: function(content, main) {
    content.style.background = '#0c0c0c';
    content.style.color = '#00ff00';
    content.style.fontFamily = '"Cascadia Code", "Consolas", "Courier New", monospace';
    content.style.fontSize = '13px';
    content.style.lineHeight = '1.5';
    content.style.padding = '12px';
    var current = ChapterManager.getCurrentChapter();
    var html = '<div class="terminal-output">';
    html += '<div class="terminal-cmd">$ cat ' + (current ? current.title.replace(/\s+/g, '_') : 'file') + '.txt</div>';
    var text = content.innerText || '';
    html += '<pre class="terminal-text">' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
    html += '<div class="terminal-cmd">$ _</div>';
    html += '</div>';
    content.innerHTML = html;
    content.classList.add('terminal-content');
  },
  _applyColorPick: function(content, main) {
    var scheme = Storage.getSettings().colorPickScheme || {};
    if (scheme.bgColor) {
      content.style.background = scheme.bgColor;
      content.style.color = scheme.textColor || this._calcTextColor(scheme.bgColor);
    }
    if (scheme.bgImage) {
      content.style.backgroundImage = 'url(' + scheme.bgImage + ')';
      content.style.backgroundSize = 'cover';
    }
    content.style.fontSize = Storage.getSettings().fontSize + 'px';
    content.style.lineHeight = Storage.getSettings().lineHeight;
  },
  _applyCustom: function(content, main) {
    var config = Storage.getCustomDisguise();
    if (config.bgImage) {
      content.style.backgroundImage = 'url(' + config.bgImage + ')';
      content.style.backgroundSize = 'cover';
    }
    if (config.textColor) content.style.color = config.textColor;
    if (config.fontSize) content.style.fontSize = config.fontSize + 'px';
  },
  _addStatusBar: function(main) {
    if (!main) return;
    var bar = document.createElement('div');
    bar.className = 'disguise-overlay vscode-statusbar';
    bar.innerHTML = '<span>main</span><span>UTF-8</span><span>JavaScript</span><span>Ln 1, Col 1</span>';
    main.appendChild(bar);
  },
  _calcTextColor: function(bgColor) {
    var hex = bgColor.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#1a1a1a' : '#e0e0e0';
  }
};

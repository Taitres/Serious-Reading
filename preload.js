const fs = require('fs');
const path = require('path');
const https = require('https');

window.services = {
  _readerWin: null,
  _readerState: null,
  _readerMoveTimer: null,

  _bookKey: function(filePath) {
    if (!filePath) return '';
    try {
      if (/^https?:\/\//i.test(filePath)) return filePath;
      return path.resolve(filePath).toLowerCase();
    } catch(e) {
      return String(filePath).toLowerCase();
    }
  },

  _getReaderBookKey: function() {
    return this._readerState && this._readerState.filePath ? this._bookKey(this._readerState.filePath) : '';
  },

  isReaderShowingBook: function(filePath) {
    return !!(this._readerWin && !this._readerWin.isDestroyed() && this._getReaderBookKey() === this._bookKey(filePath));
  },

  focusReaderWindow: function() {
    if (!this._readerWin || this._readerWin.isDestroyed()) return false;
    try {
      this.sendToReader('toggle-stealth', 'show');
      if (!this._readerWin.isVisible()) this._readerWin.show();
      this._readerWin.focus();
      return true;
    } catch(e) {
      return false;
    }
  },

  _readSavedWindowBounds: function(settings) {
    var bounds = {
      width: (settings && settings.floatWidth) || 520,
      height: (settings && settings.floatHeight) || 780,
      x: null,
      y: null
    };
    try {
      var posData = utools.dbStorage.getItem('serious_reading/winpos');
      if (posData) {
        if (posData.width > 120 && posData.width < 8000) bounds.width = posData.width;
        if (posData.height > 120 && posData.height < 8000) bounds.height = posData.height;
        if (posData.x != null && posData.y != null && posData.x > -8000 && posData.x < 8000 && posData.y > -8000 && posData.y < 8000) {
          bounds.x = posData.x;
          bounds.y = posData.y;
        }
      }
    } catch(e) {}
    if (bounds.x == null) {
      bounds.x = window.screenLeft + 90;
      bounds.y = window.screenTop + 180;
    }
    return bounds;
  },

  _saveReaderWindowBounds: function(win) {
    try {
      if (!win || win.isDestroyed()) return;
      var pos = win.getPosition();
      var size = win.getSize();
      var x = pos[0], y = pos[1], width = size[0], height = size[1];
      if (width <= 120 || width > 8000 || height <= 120 || height > 8000) return;
      if (x < -8000 || x > 8000 || y < -8000 || y > 8000) return;
      utools.dbStorage.setItem('serious_reading/winpos', { x: x, y: y, width: width, height: height });

      var settings = utools.dbStorage.getItem('serious_reading/settings') || {};
      settings.floatWidth = width;
      settings.floatHeight = height;
      utools.dbStorage.setItem('serious_reading/settings', settings);
    } catch(e) {}
  },

  _bindReaderWindowBounds: function(win) {
    var self = this;
    var scheduleSave = function() {
      clearTimeout(self._readerMoveTimer);
      self._readerMoveTimer = setTimeout(function() {
        self._saveReaderWindowBounds(win);
      }, 300);
    };
    try { win.on('move', scheduleSave); } catch(e) {}
    try { win.on('resize', scheduleSave); } catch(e) {}
    try { win.on('resized', scheduleSave); } catch(e) {}
    try { win.on('moved', scheduleSave); } catch(e) {}
  },

  _showReaderWindow: function() {
    var self = this;
    if (self._readerWin && !self._readerWin.isDestroyed()) {
      try {
        self.sendToReader('toggle-stealth', 'show');
        if (!self._readerWin.isVisible()) {
          self._readerWin.show();
        }
        self._readerWin.focus();
        return true;
      } catch(e) {}
    }
    return false;
  },

  // When plugin is triggered, show hidden reader window if exists
  _onPluginEnter: function() {
    if (this._readerWin && !this._readerWin.isDestroyed()) {
      try {
        this.sendToReader('toggle-stealth', 'show');
        if (!this._readerWin.isVisible()) {
          this._readerWin.show();
        }
        this._readerWin.focus();
      } catch(e) {}
    }
  },

  readFile: (filePath) => {
    try {
      var buf = fs.readFileSync(filePath);
      return window.services.decodeBuffer(buf);
    } catch (e) {
      return null;
    }
  },
  decodeBuffer: (buf) => {
    if (window.services.isUtf8(buf)) return buf.toString('utf-8');
    try {
      var iconv = require('./node_modules/iconv-lite');
      var detected = iconv.decode(buf, 'gbk');
      return detected;
    } catch (e2) {
      return buf.toString('utf-8');
    }
  },
  isUtf8: (buf) => {
    var i = 0;
    var len = buf.length;
    while (i < len) {
      var b = buf[i];
      if (b < 0x80) { i++; continue; }
      if ((b & 0xE0) === 0xC0) {
        if (i + 1 >= len || (buf[i+1] & 0xC0) !== 0x80) return false;
        i += 2;
      } else if ((b & 0xF0) === 0xE0) {
        if (i + 2 >= len || (buf[i+1] & 0xC0) !== 0x80 || (buf[i+2] & 0xC0) !== 0x80) return false;
        i += 3;
      } else if ((b & 0xF8) === 0xF0) {
        if (i + 3 >= len || (buf[i+1] & 0xC0) !== 0x80 || (buf[i+2] & 0xC0) !== 0x80 || (buf[i+3] & 0xC0) !== 0x80) return false;
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  },
  readBinaryFile: (filePath) => {
    try {
      return fs.readFileSync(filePath);
    } catch (e) {
      return null;
    }
  },
  writeFile: (filePath, content) => {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (e) {
      return false;
    }
  },
  fileExists: (filePath) => {
    return fs.existsSync(filePath);
  },
  fetchUrl: (url) => {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return window.services.fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  },
  showOpenDialog: (options) => {
    return utools.showOpenDialog(options);
  },
  screenColorPick: (callback) => {
    utools.screenColorPick(callback);
  },
  screenCapture: (callback) => {
    utools.screenCapture(callback);
  },
  readEpub: function(filePath) {
    try {
      var AdmZip = require('./node_modules/adm-zip');
      var zip = new AdmZip(filePath);
      var containerXml = zip.readAsText('META-INF/container.xml');
      if (!containerXml) return null;
      var opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
      if (!opfPathMatch) return null;
      var opfPath = opfPathMatch[1];
      var opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
      var opfXml = zip.readAsText(opfPath);
      if (!opfXml) return null;
      var manifest = {};
      var manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*media-type="([^"]+)"[^>]*/g;
      var mMatch;
      while ((mMatch = manifestRegex.exec(opfXml)) !== null) {
        manifest[mMatch[1]] = { href: mMatch[2], type: mMatch[3] };
      }
      var spineItems = [];
      var spineRegex = /<itemref\s+idref="([^"]+)"/g;
      var sMatch;
      while ((sMatch = spineRegex.exec(opfXml)) !== null) {
        spineItems.push(sMatch[1]);
      }
      var ncxIdMatch = opfXml.match(/<spine[^>]*toc="([^"]+)"/);
      var toc = [];
      if (ncxIdMatch) {
        var ncxItem = manifest[ncxIdMatch[1]];
        if (ncxItem) {
          var ncxPath = opfDir + ncxItem.href;
          var ncxXml = zip.readAsText(ncxPath);
          if (ncxXml) {
            var navPointRegex = /<navPoint[^>]*playOrder="(\d+)"[^>]*>[\s\S]*?<text>([^<]+)<\/text>[\s\S]*?<content\s+src="([^"]+)"/g;
            var npMatch;
            while ((npMatch = navPointRegex.exec(ncxXml)) !== null) {
              toc.push({ order: parseInt(npMatch[1]), title: npMatch[2], src: npMatch[3] });
            }
          }
        }
      }
      var chapters = [];
      spineItems.forEach(function(id, idx) {
        var item = manifest[id];
        if (!item || !item.type.match(/html|xhtml/)) return;
        var htmlPath = opfDir + item.href;
        var htmlContent = zip.readAsText(htmlPath);
        if (!htmlContent) return;
        var title = '';
        var tocItem = toc.find(function(t) { return t.src && t.src.includes(item.href); });
        if (tocItem) title = tocItem.title;
        if (!title) title = 'Chapter ' + (idx + 1);
        chapters.push({ title: title, content: htmlContent, index: idx });
      });
      var titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
      return {
        title: titleMatch ? titleMatch[1] : filePath.split(/[/\\]/).pop(),
        filePath: filePath,
        format: 'epub',
        chapters: chapters,
        totalChapters: chapters.length
      };
    } catch (e) {
      return null;
    }
  },
  createReaderWindow: function(state) {
    window.services._readerState = state;
    if (window.services._readerWin && !window.services._readerWin.isDestroyed()) {
      try {
        window.services.sendToReader('toggle-stealth', 'show');
        if (!window.services._readerWin.isVisible()) window.services._readerWin.show();
        window.services._readerWin.focus();
        window.services._readerWin.webContents.send('reading-state', state);
      } catch(e) {}
      return window.services._readerWin;
    }
    var settings = state.settings || {};
    var bounds = window.services._readSavedWindowBounds(settings);
    var win = utools.createBrowserWindow('reader.html', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      title: '',
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: true,
      backgroundColor: 'rgba(255,255,255,0.01)',
      skipTaskbar: true,
      hasShadow: false,
      thickFrame: false,
      roundedCorners: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      closeable: true,
      webPreferences: {
        preload: 'reader_preload.js'
      }
    }, function() {
      win.webContents.send('reading-state', state);
      try { win.setAlwaysOnTop(true, 'screen-saver'); } catch(e) {}
      window.services._saveReaderWindowBounds(win);
    });
    window.services._bindReaderWindowBounds(win);
    win.on('close', function() { window.services._saveReaderWindowBounds(win); });
    win.on('closed', function() {
      window.services._saveReaderWindowBounds(win);
      window.services._readerWin = null;
      window.services._readerState = null;
    });
    window.services._readerWin = win;
    return win;
  },
  sendToReader: function(channel, data) {
    if (window.services._readerWin && !window.services._readerWin.isDestroyed()) {
      try { window.services._readerWin.webContents.send(channel, data); } catch(e) {}
    }
  }
};

var { ipcRenderer } = require('electron');
window._ipcRenderer = ipcRenderer;

// Handle IPC from reader window (forwarded through reader_preload.js)
ipcRenderer.on('hide-reader-window', function() {
  var win = window.services._readerWin;
  if (win && !win.isDestroyed()) {
    try { window.services._saveReaderWindowBounds(win); } catch(e) {}
    try { win.hide(); } catch(e) {}
  }
});

ipcRenderer.on('save-reader-bounds', function(event, data) {
  // Prefer bounds data from child window (using screenLeft/screenTop), fall back to proxy
  if (data && data.x != null && data.y != null && data.width > 0 && data.height > 0) {
    try {
      utools.dbStorage.setItem('serious_reading/winpos', { x: data.x, y: data.y, width: data.width, height: data.height });
      var settings = utools.dbStorage.getItem('serious_reading/settings') || {};
      settings.floatWidth = data.width;
      settings.floatHeight = data.height;
      utools.dbStorage.setItem('serious_reading/settings', settings);
    } catch(e) {}
  } else {
    var win = window.services._readerWin;
    if (win && !win.isDestroyed()) {
      try { window.services._saveReaderWindowBounds(win); } catch(e) {}
    }
  }
});

ipcRenderer.on('toggle-stealth', function(event, action) {
  window.services.sendToReader('toggle-stealth', action);
});

window.Storage = {
  _prefix: 'serious_reading/',
  _store: null,
  _getStore: function() {
    if (this._store) return this._store;
    try {
      if (typeof utools !== 'undefined' && utools.dbStorage) {
        this._store = 'utools';
        return 'utools';
      }
    } catch(e) {}
    this._store = 'local';
    return 'local';
  },
  get: function(key) {
    var k = this._prefix + key;
    if (this._getStore() === 'utools') return utools.dbStorage.getItem(k);
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch(e) { return null; }
  },
  set: function(key, value) {
    var k = this._prefix + key;
    if (this._getStore() === 'utools') { utools.dbStorage.setItem(k, value); return; }
    try { localStorage.setItem(k, JSON.stringify(value)); } catch(e) {}
  },
  remove: function(key) {
    var k = this._prefix + key;
    if (this._getStore() === 'utools') { utools.dbStorage.removeItem(k); return; }
    try { localStorage.removeItem(k); } catch(e) {}
  },
  getSettings: function() {
    return this.get('settings') || {
      fontSize: 16,
      lineHeight: 1.8,
      padding: 40,
      theme: 'light',
      defaultDisguise: 'vscode',
      bossKeyEnabled: true,
      mouseAction: 'doubleclick',
      mouseEdgeAction: 'none',
      opacity: 1.0,
      autoPageSize: 0
    };
  },
  saveSettings: function(settings) {
    this.set('settings', settings);
  },
  getReadingHistory: function() {
    return this.get('history') || [];
  },
  saveReadingHistory: function(history) {
    this.set('history', history);
  },
  addRecentBook: function(bookInfo) {
    var history = this.getReadingHistory();
    var idx = history.findIndex(function(b) { return b.filePath === bookInfo.filePath; });
    if (idx >= 0) {
      history.splice(idx, 1);
    }
    history.unshift(bookInfo);
    if (history.length > 20) history = history.slice(0, 20);
    this.saveReadingHistory(history);
  },
  getBookProgress: function(filePath) {
    return this.get('progress/' + filePath);
  },
  saveBookProgress: function(filePath, progress) {
    this.set('progress/' + filePath, progress);
  },
  getBookmarks: function(filePath) {
    return this.get('bookmarks/' + filePath) || [];
  },
  saveBookmarks: function(filePath, bookmarks) {
    this.set('bookmarks/' + filePath, bookmarks);
  },
  getColorSchemes: function() {
    return this.get('color_schemes') || [];
  },
  saveColorSchemes: function(schemes) {
    this.set('color_schemes', schemes);
  },
  getCustomDisguise: function() {
    return this.get('custom_disguise') || {};
  },
  saveCustomDisguise: function(config) {
    this.set('custom_disguise', config);
  }
};

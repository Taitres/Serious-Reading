window.Storage = {
  _prefix: 'serious_reading/',
  get: function(key) {
    return utools.dbStorage.getItem(this._prefix + key);
  },
  set: function(key, value) {
    utools.dbStorage.setItem(this._prefix + key, value);
  },
  remove: function(key) {
    utools.dbStorage.removeItem(this._prefix + key);
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

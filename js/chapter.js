window.ChapterManager = {
  _book: null,
  _currentChapterIndex: 0,
  load: function(book) {
    this._book = book;
    this._currentChapterIndex = 0;
  },
  getBook: function() {
    return this._book;
  },
  getCurrentChapter: function() {
    if (!this._book || !this._book.chapters) return null;
    return this._book.chapters[this._currentChapterIndex];
  },
  getCurrentIndex: function() {
    return this._currentChapterIndex;
  },
  setChapter: function(index) {
    if (!this._book) return false;
    if (index < 0 || index >= this._book.totalChapters) return false;
    this._currentChapterIndex = index;
    return true;
  },
  nextChapter: function() {
    return this.setChapter(this._currentChapterIndex + 1);
  },
  prevChapter: function() {
    return this.setChapter(this._currentChapterIndex - 1);
  },
  getChapterList: function() {
    if (!this._book) return [];
    return this._book.chapters.map(function(ch, i) {
      return { title: ch.title, index: i, level: ch.level || 0 };
    });
  },
  searchChapters: function(keyword) {
    if (!this._book) return [];
    var kw = keyword.toLowerCase();
    return this._book.chapters.filter(function(ch) {
      return ch.title.toLowerCase().includes(kw);
    }).map(function(ch) {
      return { title: ch.title, index: ch.index };
    });
  },
  getProgress: function() {
    if (!this._book || this._book.totalChapters === 0) return 0;
    return Math.round((this._currentChapterIndex + 1) / this._book.totalChapters * 100);
  },
  renderChapterContent: function(chapter) {
    if (!chapter) return '';
    var content = chapter.content;
    if (this._book && this._book.format === 'epub') {
      content = content.replace(/<img[^>]*src="([^"]+)"[^>]*>/g, '');
      content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
      return content;
    }
    if (this._book && this._book.format === 'md') {
      return this._renderMarkdown(content);
    }
    var paragraphs = content.split(/\n+/);
    return paragraphs.filter(function(p) { return p.trim(); })
      .map(function(p) { return '<p>' + p.trim() + '</p>'; })
      .join('');
  },
  _renderMarkdown: function(text) {
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    text = text.replace(/\n{2,}/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    return '<p>' + text + '</p>';
  }
};

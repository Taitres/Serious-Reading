window.Reader = {
  _autoPageTimer: null,
  _scrollDebounceTimer: null,
  init: function() {
    this._bindEvents();
    this._bindSubInput();
  },
  render: function() {
    var chapter = ChapterManager.getCurrentChapter();
    if (!chapter) return;
    var content = ChapterManager.renderChapterContent(chapter);
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      readerContent.innerHTML = content;
      readerContent.scrollTop = 0;
      readerContent.style.opacity = Storage.getSettings().opacity || 1.0;
    }
    this._updateUI();
    this._saveProgress();
  },
  _bindEvents: function() {
    var self = this;
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      readerContent.addEventListener('scroll', function() {
        clearTimeout(self._scrollDebounceTimer);
        self._scrollDebounceTimer = setTimeout(function() {
          self._updateProgressBar();
          self._saveScrollPosition();
        }, 200);
      });
      readerContent.addEventListener('wheel', function(e) {
        if (!e.ctrlKey) {
          e.preventDefault();
          var scrollAmount = readerContent.clientHeight * 0.85;
          if (e.deltaY > 0) {
            readerContent.scrollTop += scrollAmount;
          } else {
            readerContent.scrollTop -= scrollAmount;
          }
        }
      }, { passive: false });
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'PageDown') {
        e.preventDefault();
        self._pageDown();
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        self._pageUp();
      }
    });
  },
  _bindSubInput: function() {
    if (typeof utools !== 'undefined' && utools.setSubInput) {
      utools.setSubInput(function(details) {
        var results = ChapterManager.searchChapters(details.text);
        if (results.length > 0) {
          ChapterManager.setChapter(results[0].index);
          Reader.render();
        }
      }, '搜索章节...');
    }
  },
  _updateUI: function() {
    var bookTitle = document.getElementById('book-title');
    var chapterProgress = document.getElementById('chapter-progress');
    var chapterList = document.getElementById('chapter-list');
    var current = ChapterManager.getCurrentChapter();
    var book = ChapterManager.getBook();
    if (bookTitle && book) bookTitle.textContent = book.title;
    if (chapterProgress && current) {
      chapterProgress.textContent = (current.index + 1) + '/' + book.totalChapters + '  ' + ChapterManager.getProgress() + '%';
    }
    if (chapterList) {
      var chapters = ChapterManager.getChapterList();
      var html = '';
      chapters.forEach(function(ch) {
        var cls = 'chapter-item' + (ch.level > 1 ? ' section' : '') + (ch.index === ChapterManager.getCurrentIndex() ? ' active' : '');
        html += '<div class="' + cls + '" data-index="' + ch.index + '">' + ch.title + '</div>';
      });
      chapterList.innerHTML = html;
      chapterList.querySelectorAll('.chapter-item').forEach(function(el) {
        el.addEventListener('click', function() {
          ChapterManager.setChapter(parseInt(this.dataset.index));
          Reader.render();
        });
      });
    }
    this._updateProgressBar();
  },
  _updateProgressBar: function() {
    var readerContent = document.getElementById('reader-content');
    var progressFill = document.getElementById('progress-fill');
    if (readerContent && progressFill) {
      var scrollPercent = readerContent.scrollTop / (readerContent.scrollHeight - readerContent.clientHeight) * 100;
      var chapterProgress = ChapterManager.getProgress();
      var totalProgress = chapterProgress * 0.7 + scrollPercent * 0.3 / 100 * 70 + scrollPercent * 0.3;
      progressFill.style.width = Math.min(totalProgress, 100) + '%';
    }
  },
  _saveProgress: function() {
    var book = ChapterManager.getBook();
    if (!book) return;
    Storage.saveBookProgress(book.filePath, {
      chapterIndex: ChapterManager.getCurrentIndex(),
      scrollPosition: 0,
      timestamp: Date.now()
    });
    Storage.addRecentBook({
      filePath: book.filePath,
      title: book.title,
      format: book.format,
      lastChapter: ChapterManager.getCurrentIndex(),
      lastRead: Date.now()
    });
  },
  _saveScrollPosition: function() {
    var book = ChapterManager.getBook();
    var readerContent = document.getElementById('reader-content');
    if (!book || !readerContent) return;
    var progress = Storage.getBookProgress(book.filePath);
    if (progress) {
      progress.scrollPosition = readerContent.scrollTop;
      Storage.saveBookProgress(book.filePath, progress);
    }
  },
  _pageDown: function() {
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      var remaining = readerContent.scrollHeight - readerContent.scrollTop - readerContent.clientHeight;
      if (remaining < 50) {
        if (ChapterManager.nextChapter()) this.render();
      } else {
        readerContent.scrollTop += readerContent.clientHeight * 0.85;
      }
    }
  },
  _pageUp: function() {
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      if (readerContent.scrollTop < 50) {
        if (ChapterManager.prevChapter()) this.render();
      } else {
        readerContent.scrollTop -= readerContent.clientHeight * 0.85;
      }
    }
  },
  startAutoPage: function(interval) {
    this.stopAutoPage();
    this._autoPageTimer = setInterval(function() {
      Reader._pageDown();
    }, interval || 5000);
  },
  stopAutoPage: function() {
    if (this._autoPageTimer) {
      clearInterval(this._autoPageTimer);
      this._autoPageTimer = null;
    }
  },
  restoreProgress: function(filePath) {
    var progress = Storage.getBookProgress(filePath);
    if (progress) {
      ChapterManager.setChapter(progress.chapterIndex || 0);
      this.render();
      var readerContent = document.getElementById('reader-content');
      if (readerContent && progress.scrollPosition) {
        setTimeout(function() {
          readerContent.scrollTop = progress.scrollPosition;
        }, 100);
      }
    }
  },
  applySettings: function() {
    var settings = Storage.getSettings();
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      readerContent.style.fontSize = settings.fontSize + 'px';
      readerContent.style.lineHeight = settings.lineHeight;
      readerContent.style.padding = settings.padding + 'px';
      readerContent.style.opacity = settings.opacity || 1.0;
      if (settings.theme === 'green') {
        readerContent.style.background = '#c7edcc';
        readerContent.style.color = '#333';
      } else if (settings.theme === 'dark') {
        readerContent.style.background = '#1a1a1a';
        readerContent.style.color = '#e0e0e0';
      } else {
        readerContent.style.background = '#ffffff';
        readerContent.style.color = '#333333';
      }
    }
  },
  addBookmark: function() {
    var book = ChapterManager.getBook();
    var chapter = ChapterManager.getCurrentChapter();
    var readerContent = document.getElementById('reader-content');
    if (!book || !chapter || !readerContent) return;
    var bookmarks = Storage.getBookmarks(book.filePath);
    var bookmark = {
      chapterIndex: chapter.index,
      chapterTitle: chapter.title,
      scrollPosition: readerContent.scrollTop,
      timestamp: Date.now()
    };
    bookmarks.push(bookmark);
    Storage.saveBookmarks(book.filePath, bookmarks);
  }
};

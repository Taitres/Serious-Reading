window.Parser = {
  parseFile: function(filePath, content) {
    var ext = filePath.split('.').pop().toLowerCase();
    if (ext === 'txt') return this.parseTxt(content, filePath);
    if (ext === 'md' || ext === 'markdown') return this.parseMd(content, filePath);
    if (ext === 'epub') return this.parseEpub(filePath);
    return null;
  },
  parseTxt: function(content, filePath) {
    if (content.charCodeAt(0) === 0xFEFF) content = content.substring(1);
    var chapterPattern = /^(第[零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟\d]+[章节回卷集部篇](?![的得了地]))\s*(.*)/gm;
    var chapters = [];
    var match;
    var lastIndex = 0;
    var lastChapterEnd = 0;
    while ((match = chapterPattern.exec(content)) !== null) {
      if (chapters.length === 0 && match.index > 0) {
        var preContent = content.substring(0, match.index).trim();
        if (preContent.length > 0) {
          chapters.push({ title: '开篇', content: preContent, index: 0 });
        }
      } else if (chapters.length > 0) {
        chapters[chapters.length - 1].content = content.substring(lastChapterEnd, match.index).trim();
      }
      chapters.push({ title: match[0].trim(), content: '', index: chapters.length });
      lastChapterEnd = match.index + match[0].length;
      if (chapters.length > 5000) break;
    }
    if (chapters.length > 0) {
      chapters[chapters.length - 1].content = content.substring(lastChapterEnd).trim();
    } else {
      chapters.push({ title: '全文', content: content.trim(), index: 0 });
    }
    return {
      title: this._extractTitle(filePath),
      filePath: filePath,
      format: 'txt',
      chapters: chapters,
      totalChapters: chapters.length
    };
  },
  parseMd: function(content, filePath) {
    var self = this;
    var lines = content.split('\n');
    var chapters = [];
    var currentChapter = { title: '开篇', content: '', index: 0 };
    var buffer = [];
    lines.forEach(function(line) {
      var headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        if (buffer.length > 0 || currentChapter.content) {
          currentChapter.content = buffer.join('\n').trim();
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: headingMatch[2].trim(),
          content: '',
          index: chapters.length,
          level: headingMatch[1].length
        };
        buffer = [];
      } else {
        buffer.push(line);
      }
    });
    currentChapter.content = buffer.join('\n').trim();
    chapters.push(currentChapter);
    return {
      title: self._extractTitle(filePath),
      filePath: filePath,
      format: 'md',
      chapters: chapters,
      totalChapters: chapters.length
    };
  },
  parseEpub: function(filePath) {
    return { _epub: true, filePath: filePath, format: 'epub' };
  },
  parseOnline: function(html, url) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var title = doc.querySelector('title');
    title = title ? title.textContent.trim() : url;
    var content = this._extractContent(doc);
    var chapters = [{ title: title, content: content, index: 0 }];
    return {
      title: title,
      filePath: url,
      format: 'online',
      chapters: chapters,
      totalChapters: chapters.length
    };
  },
  _extractContent: function(doc) {
    var selectors = ['article', '.content', '.article-content', '#content', '.post-content', '.entry-content', 'main'];
    for (var i = 0; i < selectors.length; i++) {
      var el = doc.querySelector(selectors[i]);
      if (el && el.textContent.trim().length > 100) {
        return el.innerHTML;
      }
    }
    var body = doc.querySelector('body');
    return body ? body.innerHTML : '';
  },
  _extractTitle: function(filePath) {
    var name = filePath.replace(/\\/g, '/').split('/').pop();
    return name.replace(/\.[^.]+$/, '');
  }
};

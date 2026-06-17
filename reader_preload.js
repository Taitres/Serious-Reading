const fs = require('fs');
const path = require('path');
const https = require('https');

window.services = {
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
      return iconv.decode(buf, 'gbk');
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
      while ((sMatch = spineRegex.exec(opfXml)) !== null) { spineItems.push(sMatch[1]); }
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
        filePath: filePath, format: 'epub',
        chapters: chapters, totalChapters: chapters.length
      };
    } catch (e) { return null; }
  },
  screenColorPick: (callback) => { utools.screenColorPick(callback); },
  screenCapture: (callback) => { utools.screenCapture(callback); }
};

try {
  window.electronRequire = require;
} catch(e) {}

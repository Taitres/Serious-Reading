const fs = require('fs');
const path = require('path');
const https = require('https');

window.services = {
  readFile: (filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      return null;
    }
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
  }
};

var { ipcRenderer } = require('electron');
window._ipcRenderer = ipcRenderer;

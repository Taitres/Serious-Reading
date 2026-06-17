window.ColorPicker = {
  _schemes: [],
  init: function() {
    this._schemes = Storage.getColorSchemes();
  },
  pickColor: function() {
    if (typeof utools !== 'undefined' && utools.screenColorPick) {
      utools.screenColorPick(function(colors) {
        var textColor = Disguise._calcTextColor(colors.hex);
        var scheme = {
          name: 'Color ' + colors.hex,
          bgColor: colors.hex,
          textColor: textColor,
          rgb: colors.rgb
        };
        this._schemes.push(scheme);
        Storage.saveColorSchemes(this._schemes);
        this.applyScheme(scheme);
      }.bind(this));
    }
  },
  captureBackground: function() {
    if (typeof utools !== 'undefined' && utools.screenCapture) {
      utools.screenCapture(function(image) {
        var scheme = {
          name: 'Capture ' + new Date().toLocaleTimeString(),
          bgImage: image,
          textColor: '#e0e0e0'
        };
        this._schemes.push(scheme);
        Storage.saveColorSchemes(this._schemes);
        this.applyScheme(scheme);
      }.bind(this));
    }
  },
  applyScheme: function(scheme) {
    var settings = Storage.getSettings();
    settings.colorPickScheme = scheme;
    Storage.saveSettings(settings);
    Disguise.setMode('colorpick');
    var readerContent = document.getElementById('reader-content');
    if (readerContent) {
      if (scheme.bgColor) {
        readerContent.style.background = scheme.bgColor;
        readerContent.style.color = scheme.textColor || Disguise._calcTextColor(scheme.bgColor);
      }
      if (scheme.bgImage) {
        readerContent.style.backgroundImage = 'url(' + scheme.bgImage + ')';
        readerContent.style.backgroundSize = 'cover';
        readerContent.style.backgroundPosition = 'center';
      }
    }
  },
  getSchemes: function() {
    return this._schemes;
  },
  removeScheme: function(index) {
    this._schemes.splice(index, 1);
    Storage.saveColorSchemes(this._schemes);
  }
};

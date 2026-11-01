const { BrowserWindow } = require('electron');
const path = require('node:path');

class OverlayWindow {
  constructor() {
    this.window = null;
    this.visible = false;
  }

  createWindow() {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this.window = new BrowserWindow({
      width: 420,
      height: 480,
      x: 30,
      y: 30,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      focusable: false,
      skipTaskbar: true,
      hasShadow: false,
      resizable: false,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');
    if (typeof this.window.setVisibleOnAllWorkspaces === 'function') {
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }
    this.window.setIgnoreMouseEvents(true, { forward: true });

    const overlayHtmlPath = path.join(__dirname, '..', 'overlay', 'overlay.html');
    this.window.loadFile(overlayHtmlPath);

    this.window.on('closed', () => {
      this.window = null;
      this.visible = false;
    });

    return this.window;
  }

  showPrimedCategory(category, hudMode = 'corner', timeoutMs = 3000) {
    if (!this.window || this.window.isDestroyed()) {
      this.createWindow();
    }

    this.visible = true;
    this.window.showInactive();
    this.window.setAlwaysOnTop(true, 'screen-saver');

    this.window.webContents.send('hud:show', {
      category,
      hudMode,
      timeoutMs
    });
  }

  showCooldown(remainingMs) {
    if (!this.window || this.window.isDestroyed()) {
      this.createWindow();
    }

    this.visible = true;
    this.window.showInactive();
    this.window.setAlwaysOnTop(true, 'screen-saver');

    this.window.webContents.send('hud:cooldown', {
      remainingMs
    });
  }

  hide() {
    if (this.window && !this.window.isDestroyed()) {
      this.visible = false;
      this.window.webContents.send('hud:hide');
      setTimeout(() => {
        if (!this.visible && this.window && !this.window.isDestroyed()) {
          this.window.hide();
        }
      }, 200);
    }
  }

  isVisible() {
    return this.visible;
  }

  destroy() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
      this.visible = false;
    }
  }
}

module.exports = {
  OverlayWindow
};

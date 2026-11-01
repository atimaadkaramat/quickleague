const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('node:path');
const { ConfigManager } = require('./config-manager');
const { OverlayWindow } = require('./overlay-window');
const { StateMachine } = require('./state-machine');
const { RateLimiter } = require('./rate-limiter');
const { InputSimulator } = require('./input-simulator');
const { WindowMonitor } = require('./window-monitor');

let mainWindow = null;
let overlayWindow = null;
let configManager = null;
let stateMachine = null;
let rateLimiter = null;
let inputSimulator = null;
let windowMonitor = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 800,
    minHeight: 550,
    backgroundColor: '#121316',
    title: 'QuickLeague — Rocket League Quick Chat Studio',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerNumpadHotkeys() {
  globalShortcut.unregisterAll();

  // Register Numpad 0 through 9
  const numpadKeys = [
    'num0', 'num1', 'num2', 'num3', 'num4',
    'num5', 'num6', 'num7', 'num8', 'num9'
  ];

  numpadKeys.forEach((key, index) => {
    try {
      globalShortcut.register(key, () => {
        handleTriggerKey(`Numpad${index}`);
      });
    } catch {
      // Hotkey conflict or unsupported in environment
    }
  });
}

function setEscapeListener(enable) {
  if (enable) {
    try {
      globalShortcut.register('Escape', () => {
        if (stateMachine && stateMachine.getState() === 'PRIMED') {
          handleTriggerKey('Escape');
        }
      });
    } catch {
      // Ignore
    }
  } else {
    try {
      globalShortcut.unregister('Escape');
    } catch {
      // Ignore
    }
  }
}

async function handleTriggerKey(keyName) {
  if (!stateMachine) return;

  // Only trigger if Rocket League is active or if testing
  const isGameActive = windowMonitor ? windowMonitor.isRocketLeagueActive() : true;
  if (!isGameActive && stateMachine.getState() === 'IDLE') {
    return;
  }

  const action = stateMachine.handleKey(keyName);

  if (action.type === 'SHOW_HUD') {
    setEscapeListener(true);
    if (overlayWindow) {
      overlayWindow.showPrimedCategory(action.category, action.hudMode, stateMachine.autoDismissMs);
    }
  } else if (action.type === 'HIDE_HUD') {
    setEscapeListener(false);
    if (overlayWindow) {
      overlayWindow.hide();
    }
  } else if (action.type === 'SEND_CHAT') {
    setEscapeListener(false);

    // Rate Limiter Check (Rocket League Anti-Spam Cooldown Guard)
    if (rateLimiter && !rateLimiter.canSend()) {
      const remainingMs = rateLimiter.getRemainingCooldown();
      if (overlayWindow) {
        overlayWindow.showCooldown(remainingMs);
      }
      return;
    }

    if (overlayWindow) {
      overlayWindow.hide();
    }

    if (rateLimiter) {
      rateLimiter.recordSend();
    }

    if (inputSimulator) {
      await inputSimulator.sendChat(action.text, action.channel);
    }
  }
}

app.whenReady().then(() => {
  configManager = new ConfigManager();
  const config = configManager.loadConfig();

  overlayWindow = new OverlayWindow();
  overlayWindow.createWindow();

  rateLimiter = new RateLimiter({ maxMessages: 3, windowMs: 3000 });
  inputSimulator = new InputSimulator();
  windowMonitor = new WindowMonitor();

  stateMachine = new StateMachine(config, {
    autoDismissMs: (config.autoDismissSeconds || 3) * 1000,
    onStateChange: (change) => {
      if (change.state === 'IDLE') {
        setEscapeListener(false);
        if (overlayWindow) {
          overlayWindow.hide();
        }
      }
    }
  });

  registerNumpadHotkeys();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ================= IPC Communication =================
ipcMain.handle('config:get', () => {
  return configManager ? configManager.loadConfig() : null;
});

ipcMain.handle('config:save', (event, updatedConfig) => {
  if (configManager) {
    configManager.saveConfig(updatedConfig);
    if (stateMachine) {
      stateMachine.updateConfig(updatedConfig);
    }
  }
  return { success: true };
});

ipcMain.handle('gamepad:trigger', (event, keyName) => {
  handleTriggerKey(keyName);
  return { success: true };
});

ipcMain.handle('pack:export', async (event, categoryName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export QuickLeague Pack',
    defaultPath: `${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.rlchat`,
    filters: [{ name: 'QuickLeague Pack (*.rlchat)', extensions: ['rlchat'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      configManager.exportPack(result.filePath, categoryName);
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

ipcMain.handle('pack:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import QuickLeague Pack',
    filters: [{ name: 'QuickLeague Pack (*.rlchat)', extensions: ['rlchat'] }],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const importedCategory = configManager.importPack(result.filePaths[0]);
      return { success: true, category: importedCategory };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let isClickThrough = false;
let lastAltPressTime = 0;
const DOUBLE_PRESS_INTERVAL = 300;

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { lastUrl: 'https://www.google.com', opacity: 0.95 };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function createWindow() {
  const settings = loadSettings();
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('load-settings', settings);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function registerShortcuts() {
  globalShortcut.register('Alt+G', () => {
    const now = Date.now();
    if (now - lastAltPressTime < DOUBLE_PRESS_INTERVAL) {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    }
    lastAltPressTime = now;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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

ipcMain.handle('toggle-click-through', (event, enable) => {
  if (mainWindow) {
    isClickThrough = enable;
    mainWindow.setIgnoreMouseEvents(enable, { forward: true });
    return isClickThrough;
  }
  return false;
});

ipcMain.handle('save-url', (event, url) => {
  const settings = loadSettings();
  settings.lastUrl = url;
  saveSettings(settings);
  return true;
});

ipcMain.handle('get-settings', () => {
  return loadSettings();
});

ipcMain.handle('save-settings', (event, newSettings) => {
  saveSettings(newSettings);
  return true;
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

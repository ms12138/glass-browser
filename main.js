const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

let mainWindow;
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
    titleBarStyle: 'hidden',
    frame: false,
    width: 900,
    height: 600,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  });

  mainWindow.setAlwaysOnTop(true);
  
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('load-settings', settings);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerShortcuts() {
  const success = globalShortcut.register('Alt+G', () => {
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

  if (!success) {
    console.error('注册 Alt+G 失败，可能已被系统占用');
  }
}

app.on('ready', () => {
  createWindow();
  registerShortcuts();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

ipcMain.on('toggle-click-through', (event, enable) => {
  if (mainWindow) {
    isClickThrough = enable;
    mainWindow.setIgnoreMouseEvents(enable);
    event.returnValue = isClickThrough;
  } else {
    event.returnValue = false;
  }
});

ipcMain.on('save-url', (event, url) => {
  const settings = loadSettings();
  settings.lastUrl = url;
  saveSettings(settings);
  event.returnValue = true;
});

ipcMain.on('get-settings', (event) => {
  event.returnValue = loadSettings();
});

ipcMain.on('save-settings', (event, newSettings) => {
  saveSettings(newSettings);
  event.returnValue = true;
});

ipcMain.on('minimize-window', (event) => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  event.returnValue = true;
});

ipcMain.on('maximize-window', (event) => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
  event.returnValue = true;
});

ipcMain.on('close-window', (event) => {
  if (mainWindow) {
    mainWindow.close();
  }
  event.returnValue = true;
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
  event.returnValue = true;
});

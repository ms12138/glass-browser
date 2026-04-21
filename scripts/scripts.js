const { ipcRenderer } = require('electron');

let currentOpacity = 0.95;
let isClickThrough = false;

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initEventListeners();
  loadInitialSettings();
});

function initElements() {
  const webview = document.getElementById('browserView');
  const urlField = document.getElementById('urlField');
  const addressBar = document.getElementById('addressBar');
  const backBtn = document.getElementById('backBtn');
  const transparencyRange = document.getElementById('transparencyRange');
  const clickthroughBtn = document.getElementById('clickthroughBtn');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const maximizeBtn = document.getElementById('maximizeBtn');
  const closeBtn = document.getElementById('closeBtn');
  const infoBtn = document.getElementById('infoBtn');
  
  window.elements = {
    webview,
    urlField,
    addressBar,
    backBtn,
    transparencyRange,
    clickthroughBtn,
    minimizeBtn,
    maximizeBtn,
    closeBtn,
    infoBtn
  };
}

function initEventListeners() {
  const { webview, urlField, addressBar, backBtn, transparencyRange, clickthroughBtn, minimizeBtn, maximizeBtn, closeBtn, infoBtn } = window.elements;

  addressBar.addEventListener('submit', handleAddressSubmit);
  backBtn.addEventListener('click', handleBack);
  transparencyRange.addEventListener('input', handleOpacityChange);
  clickthroughBtn.addEventListener('click', toggleClickThrough);
  minimizeBtn.addEventListener('click', () => ipcRenderer.invoke('minimize-window'));
  maximizeBtn.addEventListener('click', () => ipcRenderer.invoke('maximize-window'));
  closeBtn.addEventListener('click', () => ipcRenderer.invoke('close-window'));
  infoBtn.addEventListener('click', () => ipcRenderer.invoke('open-external', 'https://github.com/ms12138/glass-browser'));

  webview.addEventListener('dom-ready', handleWebViewReady);
  webview.addEventListener('did-navigate', handleNavigation);
  webview.addEventListener('did-finish-load', handleLoadFinished);

  ipcRenderer.on('load-settings', (event, settings) => {
    applySettings(settings);
  });
}

async function loadInitialSettings() {
  try {
    const settings = await ipcRenderer.invoke('get-settings');
    applySettings(settings);
  } catch (error) {
    console.error('Error loading initial settings:', error);
  }
}

function applySettings(settings) {
  const { urlField, transparencyRange, webview } = window.elements;

  if (settings.lastUrl) {
    urlField.value = settings.lastUrl;
    loadPage(settings.lastUrl);
  }

  if (settings.opacity !== undefined) {
    currentOpacity = settings.opacity;
    const percentage = Math.round(currentOpacity * 100);
    transparencyRange.value = percentage;
    updateOpacity(currentOpacity);
  }
}

function handleAddressSubmit(e) {
  e.preventDefault();
  const { urlField } = window.elements;
  let url = urlField.value.trim();

  if (url === '') return;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    } else {
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
  }

  urlField.value = url;
  loadPage(url);
}

function loadPage(url) {
  const { webview } = window.elements;
  try {
    webview.src = url;
    ipcRenderer.invoke('save-url', url);
  } catch (error) {
    console.error('Error loading page:', error);
  }
}

function handleBack() {
  const { webview } = window.elements;
  if (webview.canGoBack()) {
    webview.goBack();
  }
}

function handleWebViewReady() {
  console.log('WebView ready');
}

function handleNavigation(e) {
  const { urlField } = window.elements;
  urlField.value = e.url;
  ipcRenderer.invoke('save-url', e.url);
}

function handleLoadFinished() {
  console.log('Page loaded');
}

function handleOpacityChange(e) {
  const percentage = parseInt(e.target.value);
  currentOpacity = percentage / 100;
  updateOpacity(currentOpacity);
  ipcRenderer.invoke('save-settings', { opacity: currentOpacity });
}

function updateOpacity(opacity) {
  document.body.style.opacity = opacity;
}

async function toggleClickThrough() {
  const { clickthroughBtn, webview } = window.elements;
  isClickThrough = !isClickThrough;
  
  try {
    await ipcRenderer.invoke('toggle-click-through', isClickThrough);
    
    if (isClickThrough) {
      clickthroughBtn.classList.add('active');
      webview.classList.add('full-size');
    } else {
      clickthroughBtn.classList.remove('active');
      webview.classList.remove('full-size');
    }
  } catch (error) {
    console.error('Error toggling click-through:', error);
    isClickThrough = !isClickThrough;
  }
}

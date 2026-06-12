const { app, BrowserWindow, ipcMain, Tray, nativeImage, screen, shell } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('disable-gpu-vsync');
app.disableHardwareAcceleration();

let mainWindow    = null;
let notifWindow   = null;
let tray          = null;
let trayMenuWin   = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 720,
    frame: false,
    transparent: true,
    resizable: false,
    show: false,
    icon: path.join(__dirname, 'assets', 'icons', 'app.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'ui', 'index.html'));

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createNotificationWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;

  notifWindow = new BrowserWindow({
    width: 400,
    height: 140,
    x: screenW - 410,
    y: screenH - 150,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    alwaysOnTop: true,
    focusable: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  notifWindow.setAlwaysOnTop(true, 'screen-saver');

  notifWindow.loadFile(path.join(__dirname, 'src', 'ui', 'notification.html'));

  notifWindow.on('closed', () => {
    notifWindow = null;
  });
}

function showNotificationPopup(data) {
  if (!notifWindow || notifWindow.isDestroyed()) {
    createNotificationWindow();
  }

  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;
  notifWindow.setPosition(screenW - 410, screenH - 150);

  const mascotMap = {
    water: 'noti_water.png',
    stretch: 'noti_stretch.png',
    eyes: 'noti_eyes.png',
    break: 'noti_break.png',
    longBreak: 'noti_longbreak.png',
    custom: 'personalizado.png',
    medication: 'noti_medication.png',
    sleep: 'noti_sleep.png',
    wake: 'noti_wake.png',
    lunch: 'noti_lunch.png',
    routine: 'noti_routine.png',
  };

  const visualType = data.visualType || data.type;
  const mascotFile = mascotMap[visualType] || 'template.png';
  const mascotPath = path.join(__dirname, 'assets', 'mascote', mascotFile);

  notifWindow.show();
  notifWindow.setAlwaysOnTop(true, 'screen-saver');
  notifWindow.moveTop();

  notifWindow.webContents.send('show-notification', {
    title: data.title,
    message: data.message,
    mascotPath,
    type: data.type, 
    playSound: data.playSound !== false,
  });

}

function showTrayMenu() {
  // Toggle: fecha se já estiver aberto
  if (trayMenuWin && !trayMenuWin.isDestroyed()) {
    trayMenuWin.close();
    return;
  }

  const bounds  = tray.getBounds();
  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.workAreaSize;

  const W = 210;
  const H = 98;

  // Centraliza horizontalmente sobre o ícone do tray
  let x = Math.round(bounds.x + (bounds.width  - W) / 2);
  // Abre acima se taskbar estiver embaixo, abaixo se estiver em cima
  let y = bounds.y > sh / 2
    ? bounds.y - H - 2
    : bounds.y + bounds.height + 2;

  // Garante que não sai da tela
  x = Math.max(0, Math.min(x, sw - W));
  y = Math.max(0, Math.min(y, sh - H));

  trayMenuWin = new BrowserWindow({
    width: W,
    height: H,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  trayMenuWin.loadFile(path.join(__dirname, 'src', 'ui', 'tray-menu.html'));

  trayMenuWin.once('ready-to-show', () => {
    trayMenuWin.show();
    trayMenuWin.focus();
  });

  // Fecha ao perder foco (clicar fora)
  trayMenuWin.on('blur', () => {
    if (trayMenuWin && !trayMenuWin.isDestroyed()) trayMenuWin.close();
  });

  trayMenuWin.on('closed', () => { trayMenuWin = null; });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'assets', 'icons', 'app.png')
  );
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  tray.setToolTip('Aquanauta');

  // Clique simples → abre janela principal
  tray.on('click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });

  // Clique duplo → abre janela principal
  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });

  // Botão direito → menu customizado Frutiger Aero
  tray.on('right-click', () => { showTrayMenu(); });
}

function createSplash() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const W = 400, H = 330;

  const splash = new BrowserWindow({
    width: W,
    height: H,
    x: Math.round((sw - W) / 2),
    y: Math.round((sh - H) / 2),
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splash.loadFile(path.join(__dirname, 'src', 'ui', 'splash.html'));

  splash.once('ready-to-show', () => splash.show());

  setTimeout(() => {
    if (!splash.isDestroyed()) splash.close();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 5000);
}

app.whenReady().then(() => {
  createWindow();
  createNotificationWindow();
  createTray();
  createSplash();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('get-asset-path', (event, ...segments) => {
  return path.join(__dirname, 'assets', ...segments);
});

ipcMain.on('show-popup-notification', (event, data) => {
  showNotificationPopup(data);
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('tray-menu-open', () => {
  if (trayMenuWin && !trayMenuWin.isDestroyed()) trayMenuWin.close();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('tray-menu-quit', () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.on('dismiss-notification', (event, dismissedType) => {
  if (notifWindow && !notifWindow.isDestroyed()) {
    notifWindow.hide();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notification-dismissed', dismissedType);
  }
});

const BASE_WIN_WIDTH = 520;
const BASE_WIN_HEIGHT = 720;

ipcMain.on('adjust-zoom', (event, delta) => {
  if (!mainWindow) return;
  const current = mainWindow.webContents.getZoomFactor();
  const next = parseFloat(Math.min(1.5, Math.max(0.6, current + delta)).toFixed(2));
  mainWindow.webContents.setZoomFactor(next);
  mainWindow.setSize(Math.round(BASE_WIN_WIDTH * next), Math.round(BASE_WIN_HEIGHT * next));
});

ipcMain.on('reset-zoom', () => {
  if (!mainWindow) return;
  mainWindow.webContents.setZoomFactor(1.0);
  mainWindow.setSize(BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
});

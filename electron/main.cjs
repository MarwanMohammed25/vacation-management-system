const { app, BrowserWindow, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// إعدادات التحديث التلقائي
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// أحداث التحديث
autoUpdater.on('checking-for-update', () => {
  console.log('جاري البحث عن تحديثات...');
});

autoUpdater.on('update-available', (info) => {
  console.log('تحديث متوفر:', info.version);
  const { dialog } = require('electron');
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'تحديث متوفر',
    message: `يتوفر إصدار جديد (${info.version})`,
    detail: 'هل تريد تنزيل التحديث الآن؟',
    buttons: ['تنزيل', 'لاحقاً']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('لا توجد تحديثات متوفرة');
});

autoUpdater.on('download-progress', (progressObj) => {
  let message = `سرعة التنزيل: ${progressObj.bytesPerSecond}`;
  message += ` - تم التنزيل ${progressObj.percent}%`;
  message += ` (${progressObj.transferred}/${progressObj.total})`;
  console.log(message);
  
  if (mainWindow) {
    mainWindow.setProgressBar(progressObj.percent / 100);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('تم تنزيل التحديث');
  if (mainWindow) {
    mainWindow.setProgressBar(-1);
  }
  
  const { dialog } = require('electron');
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'تحديث جاهز',
    message: 'تم تنزيل التحديث بنجاح',
    detail: 'سيتم تثبيت التحديث عند إغلاق التطبيق. هل تريد إعادة التشغيل الآن؟',
    buttons: ['إعادة التشغيل', 'لاحقاً']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('خطأ في التحديث:', error);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    title: 'التعمير لإدارة المرافق - نظام إدارة الإجازات',
    backgroundColor: '#ffffff',
    show: false
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // في الـ production، تحميل من dist
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Create application menu
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'إعادة تحميل',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'ملء الشاشة',
          accelerator: 'F11',
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
        },
        { type: 'separator' },
        {
          label: 'تكبير',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        },
        {
          label: 'إعادة تعيين التكبير',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.setZoomLevel(0)
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'فحص التحديثات',
          click: () => {
            if (!isDev) {
              autoUpdater.checkForUpdates();
            } else {
              const { dialog } = require('electron');
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'وضع التطوير',
                message: 'فحص التحديثات غير متاح في وضع التطوير'
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'حول',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'نظام إدارة الإجازات',
              detail: 'التعمير لإدارة المرافق\nالإصدار 2.0.1\n\nنظام متكامل لإدارة طلبات الإجازات'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // فحص التحديثات بعد 3 ثواني من بدء التطبيق
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

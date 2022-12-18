const {
    app,
    BrowserWindow,
    nativeTheme,
} = require('electron');
const path = require('path');
let argv = process.argv

const createMainWindow = () => {
    nativeTheme.themeSource = 'light'
    var mainWindow;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 725,
        show: false,
        backgroundColor: "#ffffff",
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInSubFrames: true,
            devTools: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        closable: true,
        maximizable: false,
        resizable: false,
        autoHideMenuBar: true
    });

    const startURL = `file://${path.join(__dirname, 'window.html')}`;

    mainWindow.loadURL(startURL);
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('close', (e) => {
        app.exit();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.exit();
    });

    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        require('electron').shell.openExternal(url);
    });
};

app.whenReady().then(() => {
    createMainWindow();
    app.on('activate', () => {
        if (!BrowserWindow.getAllWindows().length) {
            createMainWindow();
        }
    });
});
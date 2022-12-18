const {
    app,
    BrowserWindow,
    nativeTheme,
} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

let workingDir = path.join(os.homedir(), 'Documents', 'discord-tickets-app');
let dontMakeWindow = false;
if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir);
if (fs.existsSync(path.join(workingDir, 'ui.asar')) && !(__dirname).includes(workingDir)) {
    require(path.join(workingDir, 'ui.asar'));
    dontMakeWindow = true;
    //process.exit();
}

const createMainWindow = () => {
    if (dontMakeWindow) return;
    nativeTheme.themeSource = 'light'
    var mainWindow;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 725,
        show: false,
        backgroundColor: "#ffffff",
        webPreferences: {
            nodeIntegration: true,
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

    mainWindow.on('close', () => {
        app.exit();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.exit();
    });

    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        //require('electron').shell.openExternal(url);
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
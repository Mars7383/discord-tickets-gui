const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');
const {remote} = require('electron');
const AdmZip = require('adm-zip');

let botProcess = null;
let workingDir = path.join(os.homedir(), 'Documents', 'discord-tickets-app');

let term = new Terminal();
term.open(document.getElementById('terminal'));
//term.writeln('Hello from \x1B[1;3;31mterm.js\x1B[0m $ ');
let LRED = '\033[1;31m';
let GREEN = '\033[0;32m';
let LGREEN = '\033[1;32m';
let YELLOW = '\033[0;33m';
let BLUE = '\033[1;34m';
let LGRAY = '\033[0;37m';
let WHITE = '\033[1;37m';
let CLEAR = '\033[0m';

// update settings from config
(async () => {
    if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir);
    if (!fs.existsSync(path.join(workingDir, "bot"))) await updateBot(path.join(__dirname, 'discord-tickets-main.zip'));
    document.querySelector('#discordToken').value = await readFromConfig('discordBotToken') || '';
    document.querySelector('#discordID').value = await readFromConfig('user') || '';
    document.querySelector('#guildID').value = await readFromConfig('guild') || '';
    document.querySelector('#guildID').value = await readFromConfig('guild') || '';
    document.querySelector('#prefix').value = await readFromConfig('prefix') || '';
    document.querySelector('#newMsgsPing').checked = await readFromConfig('ghostPingOnNewMessage') || false;
    let cookie = await readFromConfig('dashboardCookie') || '';
    updateAuthText(cookie);
})();

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    if (botProcess) return;
    term.writeln(`${YELLOW}[UI] Starting bot...${CLEAR}`);
    /*botProcess = await child_process.spawn('npm', ['i'], {
        cwd: path.join(workingDir, 'bot'),
        stdio: 'inherit'
    });
    botProcess.on('close', (code) => {
        botProcess = null;
        term.writeln(`${YELLOW}[UI] Finished installing dependencies${CLEAR}`);
    });
    while (botProcess) {
        await sleep(250);
    }*/
    botProcess = child_process.spawn('node', ['index.js'].concat(...arguments), {
        cwd: path.join(workingDir, 'bot'),
        //stdio: 'inherit'
    });

    // log stdout and stderr and all other output to console
    botProcess.stdout.on('data', (data) => {
        console.log(data.toString());
        term.writeln(data.toString().trim());
    });
    botProcess.stderr.on('data', (data) => {
        console.error(data.toString());
        term.writeln(LRED + data.toString().trim() + CLEAR);
    });

    botProcess.on('close', (code) => {
        botProcess = null;
        term.writeln(`${YELLOW}[UI] Process ended.${CLEAR}`);
    });

}

async function kill() {
    if (!botProcess) {
        return;
    }

    botProcess.kill();
    botProcess = null;
    term.writeln(`${YELLOW}[UI] Bot stopped.${CLEAR}`);
}

async function reset() {
    await kill();
    await start("reset");
}

async function writeToConfig(key, value) {
    while (!fs.existsSync(path.join(workingDir, 'bot', 'config.json'))) {
        await sleep(100);
    }
    let config = JSON.parse(fs.readFileSync(path.join(workingDir, 'bot', 'config.json')));
    config[key] = value;
    fs.writeFileSync(path.join(workingDir, 'bot', 'config.json'), JSON.stringify(config, null, 4));
}
async function readFromConfig(key) {
    while (!fs.existsSync(path.join(workingDir, 'bot', 'config.json'))) {
        await sleep(100);
    }
    let config = JSON.parse(fs.readFileSync(path.join(workingDir, 'bot', 'config.json')));
    return config[key];
}
function openConfig() {
    remote.shell.openPath(path.join(workingDir, 'bot', 'config.json'));
}
async function updateBot(pathToZip) {
    if (botProcess) return alert("Please stop the bot before updating.");
    let dashboardCookie;
    let file = {filePaths: [], cancelled: true}; // default value in case pathToZip is set
    if (!pathToZip) {
        alert("Download discord-tickets-main.zip and then select it in the next dialog.");
        file = await remote.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Zip Files', extensions: ['zip'] }
            ]
        });
        dashboardCookie = await readFromConfig('dashboardCookie');
    }
    if (!file.canceled || pathToZip) {
        if (pathToZip) file.filePaths[0] = pathToZip;
        // delete the bot folder
        term.writeln(`${YELLOW}[UI] Deleting old bot files...${CLEAR}`);
        if (fs.existsSync(path.join(workingDir, 'bot')))
            deleteFolderRecursive(path.join(workingDir, 'bot'));
        let zip = new AdmZip(file.filePaths[0]);
        term.writeln(`${YELLOW}[UI] Unzipping new bot...${CLEAR}`);
        // extract everything into the bot folder in the working directory
        await zip.extractAllTo(path.join(workingDir), true);
        term.writeln(`${YELLOW}[UI] Moving files in place...${CLEAR}`);
        // rename the extracted folder to bot
        fs.renameSync(path.join(workingDir, 'discord-tickets-main'), path.join(workingDir, 'bot'));
        term.writeln(`${YELLOW}[UI] Fixing configuration...${CLEAR}`);
        // overwrite the config file with the current config
        await sleep(1000);
        let config = JSON.parse(fs.readFileSync(path.join(workingDir, 'bot', 'config.json')));
        config.discordBotToken = document.querySelector('#discordToken').value,
        config.user = document.querySelector('#discordID').value,
        config.guild = document.querySelector('#guildID').value,
        config.prefix = document.querySelector('#prefix').value,
        config.ghostPingOnNewMessage = document.querySelector('#newMsgsPing').checked,
        config.dashboardCookie = dashboardCookie
        fs.writeFileSync(path.join(workingDir, 'bot', 'config.json'), JSON.stringify(config), null, 4);
        term.writeln(`${YELLOW}[UI] ${GREEN}Bot updated!${CLEAR}`);

    }
}

async function updateAuthText(cookie) {
    let req = await fetch("https://script-ware.com/api/me/light", {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Authorization": `${cookie.includes("Bearer ") ? cookie : "Bearer " + cookie}`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Sec-GPC": "1"
        },
        "referrer": "https://script-ware.com/m/purchase",
        "method": "GET",
        "mode": "cors"
    });
    if (req.status == 200)
        document.querySelector('#account-output').innerHTML = `Logged in as ${(await req.json()).username}`;
}

async function login(m) {
    if (m) {
        // only works on macos
        if (os.platform() != 'darwin') return alert("This only works on macOS.");
        const keytar = require('keytar');
        term.writeln(`${YELLOW}[UI] Logging in with Script-Ware M...${CLEAR}`);
        //let cookie = await child_process.execSync('security find-generic-password -a "Script-Ware M" -s "Script-Ware M" -w').toString().trim();
        let response = await keytar.findCredentials("https://script-ware.com")
        if (!response[0]) 
            return term.writeln(`${YELLOW}[UI] ${LRED}Failed!!!!${YELLOW} There is no saved Script-Ware login in keychain.${CLEAR}`);
        let swmtokenResponse = runAuthProcess([response[0].account, response[0].password]);
        if (typeof swmtokenResponse != "string") return term.writeln(`${YELLOW}[UI] ${LRED}Failed!!!!${YELLOW} SWM had a problem authenticating using your saved credentials.${CLEAR}`);
        swmtokenResponse = swmtokenResponse.split(".");
        let success = swmtokenResponse.shift()
        let code = swmtokenResponse.shift()
        let swmtoken = swmtokenResponse.shift();
        let upgradeF = await fetch("https://script-ware.com/api/tkn/dash", { // taken from SWM
            method: "POST",
            body: swmtoken
        });
        if (!upgradeF.ok) return term.writeln(`${YELLOW}[UI] ${LRED}Failed!!!!${YELLOW} Either Script-Ware servers did not accept the SWM token or the request somehow failed.${CLEAR}`)
        var upgraded = await upgradeF.text()
        writeToConfig("dashboardCookie", upgraded);
        updateAuthText(upgraded);
        return term.writeln(`${YELLOW}[UI] ${GREEN}Success!${YELLOW} Logged in with Script-Ware M.${CLEAR}`);
    }
    term.writeln(`${YELLOW}[UI] Logging into the dashboard...${CLEAR}`);
    let dashboard = new remote.BrowserWindow({
        width: 600,
        height: 600,
        backgroundColor: "#202225",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            //preload: path.join(__dirname, 'cookie-yoinker.js')
        },
        autoHideMenuBar: true
    })
    await dashboard.webContents.session.clearStorageData([]);
    dashboard.loadURL("https://dashboard.script-ware.com/user")
    dashboard.webContents.on("will-navigate", (evt, url) => {
        evt.preventDefault()
        //shell.openExternal(url)
    })
    dashboard.webContents.on("new-window", (evt, url) => {
        evt.preventDefault()
        //shell.openExternal(url)
    });
    for (let i = 0; i < 600; i++) {
        await dashboard.webContents.session.cookies.get({
            domain: 'script-ware.com'
        }).then((cookies) => {            
            cookies.forEach(async (cookie) => {
                console.log(cookie.name)
                if (cookie.name.toLowerCase() == "token") {
                    writeToConfig("dashboardCookie", cookie.value);
                    updateAuthText(cookie.value);
                    term.writeln(`${YELLOW}[UI] ${GREEN}Success!${YELLOW} Logged into the dashboard.${CLEAR}`);
                    return dashboard.close();
                }
            });
        }).catch((error) => {
            console.log(error)
        })
        await sleep(1000);
    }
    return term.writeln(`${YELLOW}[UI] ${LRED}Failed!!!!${YELLOW} Timed out waiting for a login.${CLEAR}`);
}

async function logout() {
    await writeToConfig("dashboardCookie", "");
    document.querySelector('#account-output').innerHTML = "Not logged in.";
    term.writeln(`${YELLOW}[UI] Logged out.${CLEAR}`);
}

// https://stackoverflow.com/a/20920795
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

/* v From Script-Ware M, copyrighted by theLMGN and Script-Ware v */
let savedHwid = "ok",CALAMARI_API_LOCATION = "/Users/Shared/ScriptWare/",ChildProcess = child_process;
function runAuthProcess(args) {
    try {
        term.writeln(`${BLUE}[SWM] Logging in${CLEAR}`);
        var authLoc = path.join(CALAMARI_API_LOCATION, "SWMAuth2");
        if (!savedHwid || !fs.existsSync(authLoc)) {
            console.log("[SWM] Dropping auth process...")
            fs.copyFileSync(path.join(__dirname, "build/SWMAuth2"), authLoc);
            fs.chmodSync(authLoc, "777")
        }
        var args = [authLoc, args.map((a) => Buffer.from(a).toString("base64"))];
        var proc = ChildProcess.spawnSync(...args);
        var stdout = proc.stdout.toString();
        console.log(stdout, proc.stderr.toString());
        if (stdout.includes("<hwid:")) savedHwid = stdout.replace(/.*<hwid:([\dA-F]+)>.*/gs, "$1");
        if (stdout.includes("<result:")) return stdout.replace(/.*<result:(.*?)>.*/gs, "$1");
        return term.writeln(`${BLUE}[SWM] Authentication process did not return result. ${stdout} ${proc.stderr.toString()}${CLEAR}`);
    } catch (e) {
        console.error(e)
        return term.writeln(`${BLUE}[SWM] Could not authenticate: ${e.toString()}${CLEAR}`);
    }
}
/* ^ From Script-Ware M, copyrighted by theLMGN and Script-Ware ^ */
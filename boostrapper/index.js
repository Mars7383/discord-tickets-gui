const fs = require('fs');
const path = require('path');
const os = require('os');

let workingDir = path.join(os.homedir(), 'Documents', 'discord-tickets-app');
if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir);
    if (!fs.existsSync(path.join(workingDir, 'ui.asar'))) {
        fs.copyFileSync(path.join(__dirname, 'defaults', 'ui.asar'), path.join(workingDir, 'ui.asar'));
    }
}
require(path.join(workingDir, 'ui.asar', 'index.js'));
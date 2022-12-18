process.noAsar = true; // this needs to be true at first because fs.copyFile doesn't work normally with asar files
const fs = require('fs');
const path = require('path');
const os = require('os');
const asar = require('asar');

let workingDir = path.join(os.homedir(), 'Documents', 'discord-tickets-app');
if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir);
if (!fs.existsSync(path.join(workingDir, 'ui.asar'))) {
    console.log('Copying UI asar...')
    if (os.platform() === 'win32' || os.platform() === 'win64') {
        /*fs.copyFile(path.join(__dirname, '../', '../', 'defaults/', 'ui.asar'), path.join(workingDir, 'ui.asar'), (err) => {
            if (err) throw err;
            console.log('Copied UI asar.')
            process.noAsar = false; // now we can set it to false to load the asar file
            require(path.join(workingDir, 'ui.asar', 'index.js'));
        });*/
        process.noAsar = false; // now we can set it to false to load the asar file
        asar.extractAll(path.join(__dirname, '../', '../', 'defaults/', 'ui.asar'), path.join(workingDir, 'ui.asar'));
        require(path.join(workingDir, 'ui.asar', 'index.js'));

    } else if (os.platform() == 'darwin') {

    } else if (os.platform() == 'linux') {

    }
} else {
    process.noAsar = false; // now we can set it to false to load the asar file
    require(path.join(workingDir, 'ui.asar', 'index.js'));
}
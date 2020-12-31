'use strict';

const { app, dialog, ipcMain } = require('electron');
const AppDataStore = require('./AppDataStore');
const path = require('path');
const Window = require('./Window');

const appData = new AppDataStore({ name: 'Loki' });

function main() {
    //todo get window size from last invocation
    let mainWindow = new Window({
        file: path.join('renderer', 'index.html')
    });

    mainWindow.once('show', () => { //TODO investigate ready-to-show
        mainWindow.webContents.send('previouslyOpened', appData.getPreviouslyOpened());
    });

    ipcMain.on('file-open-click', () => {
        console.log('file-open-click handler on main thread');
        let openDiagResponse = dialog.showOpenDialogSync(mainWindow, {
            title: 'Open existing Loki file',
            filters: [
                { name: 'Loki File', extensions: ['loki'] }
            ],
            properties: ['openFile']
        });
        console.log('dialog returned with', openDiagResponse);
        //todo if undefined, return
        //  if array && length>0, open first file in array.
        //  if successfully opened, add to appData.
    });
};

app.on('ready', main);

app.on('window-all-closed', () => {
    appData.save();
    app.quit();
});
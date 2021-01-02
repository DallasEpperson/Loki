'use strict';

const { app, dialog, ipcMain } = require('electron');
const AppDataStore = require('./AppDataStore');
const LokiFile = require('./LokiFile');
const path = require('path');
const Window = require('./Window');

const appData = new AppDataStore({ name: 'Loki' });

function main() {
    //todo get window size from last invocation
    let menuWindow = new Window({
        file: path.join('renderer', 'menu.html'),
        width: 800,
        height: 600,
        minWidth: 300,
        minHeight: 200
    });

    menuWindow.removeMenu();

    menuWindow.once('show', () => { //TODO investigate ready-to-show
        menuWindow.webContents.send('previouslyOpened', appData.getPreviouslyOpened());
    });

    ipcMain.on('file-new-click', () => {
        console.log('file-new-click handler on main thread');
        let chosenNewFileLoc = dialog.showSaveDialogSync(menuWindow, {
            title: 'Save Loki file',
            filters: [
                { name: 'Loki File', extensions: ['loki'] }
            ]
        });
        console.log('dialog returned with', chosenNewFileLoc);
        if(!chosenNewFileLoc) return;

        let ext = path.extname(chosenNewFileLoc);
        if (!ext) chosenNewFileLoc += '.loki';
        let lokiFile = new LokiFile(chosenNewFileLoc);
        lokiFile.init().then(function(){
            console.log('main thread past loki file creation');
            appData.addPreviouslyOpened(chosenNewFileLoc);
            //TODO open & render
        });
    });

    ipcMain.on('file-open-click', () => {
        console.log('file-open-click handler on main thread');
        let openDiagResponse = dialog.showOpenDialogSync(menuWindow, {
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

    ipcMain.on('exit-click', () => {
        menuWindow.close();
    });
};

app.on('ready', main);

app.on('window-all-closed', () => {
    console.log('All windows closed - exiting.');
    appData.save();
    app.quit();
});
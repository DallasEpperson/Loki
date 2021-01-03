'use strict';

const { app, dialog, ipcMain } = require('electron');
const AppDataStore = require('./AppDataStore');
const LokiFile = require('./LokiFile');
const path = require('path');
const Window = require('./Window');

const appData = new AppDataStore({ name: 'Loki' });

let mainWindow, menuWindow;

const openFile = (fileName) => {
    console.log('openFile', fileName);
    let lokiFile = new LokiFile(fileName);
    lokiFile.init().then(function(){
        appData.addPreviouslyOpened(fileName);
    }).then(function(){
        return lokiFile.getItems();
    }).then(function(items){
        console.log('items are');
        console.log(items);
        mainWindow = new Window({
            file: path.join('renderer', 'main.html'),
            width: 800,
            height: 600,
            minWidth: 300,
            minHeight: 200
        });
        //mainWindow.webContents.openDevTools();
        mainWindow.once('show', () => {
            mainWindow.webContents.send('dbLoaded', items);
            menuWindow.close();
        });
    });
};

function main() {
    //todo get window size from last invocation
    menuWindow = new Window({
        file: path.join('renderer', 'menu.html'),
        width: 800,
        height: 600,
        minWidth: 300,
        minHeight: 200
    });

    menuWindow.removeMenu();
    //menuWindow.webContents.openDevTools();

    menuWindow.once('ready-to-show', () => {
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
            openFile(chosenNewFileLoc);
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
        if(!openDiagResponse || !Array.isArray(openDiagResponse) || openDiagResponse.length < 1)
            return;
        
        openFile(openDiagResponse[0]);
    });

    ipcMain.on('previous-file-open-click', (event, args) => {
        openFile(args.fileName);
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
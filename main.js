'use strict';

const { app, dialog, ipcMain } = require('electron');
const AppDataStore = require('./AppDataStore');
const LokiFile = require('./LokiFile');
const path = require('path');
const Window = require('./Window');

const { version } = require('./package.json');

const appData = new AppDataStore({ name: 'Loki' });

let mainWindow, menuWindow;
/**
 * @type LokiFile
 */
let currentlyOpenFile;

const openFile = (fileName) => {
    currentlyOpenFile = new LokiFile(fileName);
    currentlyOpenFile.init().then(function(){
        appData.addPreviouslyOpened(fileName);
    }).then(function(){
        return currentlyOpenFile.getItems();
    }).then(function(items){
        mainWindow = new Window({
            file: path.join('renderer', 'main.html'),
            width: 800,
            height: 600,
            minWidth: 300,
            minHeight: 200
        });
        mainWindow.webContents.openDevTools();
        mainWindow.once('show', () => {
            mainWindow.webContents.send('item-list-updated', items);
            menuWindow.close();
        });
    });
};

function main() {
    console.log(`Loki version ${version} starting`);
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
        let chosenNewFileLoc = dialog.showSaveDialogSync(menuWindow, {
            title: 'Save Loki file',
            filters: [
                { name: 'Loki File', extensions: ['loki'] }
            ]
        });
        if(!chosenNewFileLoc) return;

        let ext = path.extname(chosenNewFileLoc);
        if (!ext) chosenNewFileLoc += '.loki';
        let lokiFile = new LokiFile(chosenNewFileLoc);
        lokiFile.init().then(function(){
            openFile(chosenNewFileLoc);
        });
    });

    ipcMain.on('file-open-click', () => {
        let openDiagResponse = dialog.showOpenDialogSync(menuWindow, {
            title: 'Open existing Loki file',
            filters: [
                { name: 'Loki File', extensions: ['loki'] }
            ],
            properties: ['openFile']
        });
        if(!openDiagResponse || !Array.isArray(openDiagResponse) || openDiagResponse.length < 1)
            return;
        
        openFile(openDiagResponse[0]);
    });

    ipcMain.on('previous-file-open-click', (event, args) => {
        openFile(args.fileName);
    });

    ipcMain.on('item-details-get', (event, args) => {
        console.log('Getting details for item', args.itemId);
        currentlyOpenFile.getItem(args.itemId)
        .then(function(details){
            mainWindow.webContents.send('item-details-response', details);
        });
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
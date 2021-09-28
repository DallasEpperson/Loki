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

const openFile = async (fileName) => {
    currentlyOpenFile = new LokiFile(fileName);
    await currentlyOpenFile.init();
    appData.addPreviouslyOpened(fileName);
    let items = await currentlyOpenFile.getItems();
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
};

const showMenuWindow = () => {
    //todo get window size from last invocation
    menuWindow = new Window({
        file: path.join('renderer', 'menu.html'),
        width: 800,
        height: 600,
        minWidth: 300,
        minHeight: 200
    });
    menuWindow.removeMenu();
    menuWindow.webContents.openDevTools();
    menuWindow.once('ready-to-show', () => {
        menuWindow.webContents.send('previouslyOpened', appData.getPreviouslyOpened());
    });
};

function main() {
    console.log(`Loki version ${version} starting`);
    showMenuWindow();
};

//#region Channel event handlers

ipcMain.on('exit-click', () => {
    menuWindow.close();
});

ipcMain.on('file-open-click', () => {
    let openDiagResponse = dialog.showOpenDialogSync(menuWindow, {
        title: 'Open existing Loki file',
        filters: [
            { name: 'Loki File', extensions: ['loki'] }
        ],
        properties: ['openFile']
    });
    if(!openDiagResponse || !Array.isArray(openDiagResponse) || openDiagResponse.length < 1) {
        menuWindow.webContents.send('file-open-return');
        return;
    }
    
    openFile(openDiagResponse[0]);
});

ipcMain.on('file-new-click', () => {
    let chosenNewFileLoc = dialog.showSaveDialogSync(menuWindow, {
        title: 'Save Loki file',
        filters: [
            { name: 'Loki File', extensions: ['loki'] }
        ]
    });
    if(!chosenNewFileLoc){
        menuWindow.webContents.send('file-new-return');
        return;
    }

    let ext = path.extname(chosenNewFileLoc);
    if (!ext) chosenNewFileLoc += '.loki';
    let lokiFile = new LokiFile(chosenNewFileLoc);
    lokiFile.init().then(function(){
        openFile(chosenNewFileLoc);
    });
});

ipcMain.on('item-details-get', async (_event, args) => {
    console.log('Getting details for item', args.itemId);
    let details = await currentlyOpenFile.getItem(args.itemId);
    mainWindow.webContents.send('item-details-response', details);
});

ipcMain.on('previous-file-open-click', (_event, args) => {
    openFile(args.fileName);
});

ipcMain.on('main-window-back', () => {
    showMenuWindow();
    mainWindow.close();
});

//#endregion

//#region Main window event handlers

ipcMain.on('create-item', async (_event, args) => {
    console.log('create-item msg received');
    console.log(args);
    let newItemId = await currentlyOpenFile.addItem(args);
    let items = await currentlyOpenFile.getItems();
    mainWindow.webContents.send('item-list-updated', items);
    mainWindow.webContents.send('item-created', newItemId);
});

ipcMain.on('item-place-into-container', async (_event, args) => {
    console.log('item-place-into-container msg received');
    console.log(args);
    await currentlyOpenFile.setContainer(args.itemId, args.containerId);
    console.log('Getting details for item', args.itemId);
    let details = await currentlyOpenFile.getItem(args.itemId);
    mainWindow.webContents.send('item-details-response', details);
});

//#endregion

app.on('ready', main);

app.on('window-all-closed', () => {
    console.log('All windows closed - exiting.');
    appData.save();
    app.quit();
});
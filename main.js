'use strict';

const { app } = require('electron');
const path = require('path');
const Window = require('./Window');

function main(){
    //todo get window size from last invocation
    let mainWindow = new Window({
        file: path.join('renderer', 'index.html')
    });
};

app.on('ready', main);

app.on('window-all-closed', () => {
    app.quit();
});
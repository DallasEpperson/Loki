'use strict';

const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');

ipcRenderer.on('dbLoaded', (event, dbInfo) => {
    console.log('dbLoaded', dbInfo);
});
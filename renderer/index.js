'use strict';

const {ipcRenderer} = require('electron');

ipcRenderer.on('previouslyOpened', (event, previouslyOpened) => {
    console.log('Received previouslyOpened event', previouslyOpened);
});

document.getElementById('btnOpenFile').addEventListener('click', () => {
    console.log('sending file-open-click event');
    ipcRenderer.send('file-open-click');
});
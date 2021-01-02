'use strict';

const { ipcRenderer } = require('electron');

ipcRenderer.on('previouslyOpened', (event, previouslyOpened) => {
    console.log('Received previouslyOpened event', previouslyOpened);
    const listElement = document.getElementById('recent-file-list');
    listElement.innerHTML = '';
    for (let i = 0; i < previouslyOpened.length; i++) {
        const filePath = previouslyOpened[i];
        //todo get separator on this platform
        const fileNamePieces = filePath.split('/');
        const fileName = fileNamePieces[fileNamePieces.length - 1];
        listElement.innerHTML += `<li><a>${fileName}</a><span>${filePath}</span></li>`;
    }
});

document.getElementById('btnOpenFile').addEventListener('click', () => {
    console.log('sending file-open-click event');
    ipcRenderer.send('file-open-click');
});

document.getElementById('btnNewFile').addEventListener('click', () => {
    console.log('sending file-new-click event');
    ipcRenderer.send('file-new-click');
});
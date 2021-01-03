'use strict';

const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');

ipcRenderer.on('previouslyOpened', (event, previouslyOpened) => {
    console.log('Received previouslyOpened event', previouslyOpened);
    var listElement = $('#recent-file-list');
    listElement.empty();
    for (let i = 0; i < previouslyOpened.length; i++) {
        const filePath = previouslyOpened[i];
        //todo get separator on this platform
        const fileNamePieces = filePath.split('/');
        const fileName = fileNamePieces[fileNamePieces.length - 1];
        listElement.append(`<li data-id="${i}"><a>${fileName}</a><span>${filePath}</span></li>`);
    }
    $('#recent-file-list a').on('click', function(){
        const recentFileId = $(this).closest('li').data('id');
        console.log('user clicked recent file ', recentFileId);
        //TODO open it
    });
});

$('#btnOpenFile').on('click', function(){
    console.log('sending file-open-click event');
    ipcRenderer.send('file-open-click');
});

$('#btnNewFile').on('click', function(){
    console.log('sending file-new-click event');
    ipcRenderer.send('file-new-click');
});

$('#btnExit').on('click', function(){
    ipcRenderer.send('exit-click');
});
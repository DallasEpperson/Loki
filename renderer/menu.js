'use strict';

const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');

ipcRenderer.on('previouslyOpened', (event, previouslyOpened) => {
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
        const recentFileId = parseInt($(this).closest('li').data('id'));
        ipcRenderer.send('previous-file-open-click', {fileName: previouslyOpened[recentFileId]});
    });
});

ipcRenderer.on('file-open-return', () => {
    $('body').removeClass('blurred');
});

ipcRenderer.on('file-new-return', () => {
    $('body').removeClass('blurred');
});

$('#btnOpenFile').on('click', function(){
    $('body').addClass('blurred');
    ipcRenderer.send('file-open-click');
});

$('#btnNewFile').on('click', function(){
    $('body').addClass('blurred');
    ipcRenderer.send('file-new-click');
});

$('#btnExit').on('click', function(){
    ipcRenderer.send('exit-click');
});
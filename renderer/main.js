'use strict';

const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');

ipcRenderer.on('item-details-response', (_event, details) => {
    console.log('item-details-response', details);
    //TODO render main section of page
});

ipcRenderer.on('item-list-updated', (_event, items) => {
    console.log('item-list-updated', items);
    const itemList = $('#item-list');
    itemList.empty();
    items.forEach(item => {
        itemList.append(`<li data-id="${item.id}">${item.name}</li>`);
    });
    $('#item-list li').on('click', function(){
        const itemId = parseInt($(this).data('id'));
        ipcRenderer.send('item-details-get', {itemId: itemId});
    });
});
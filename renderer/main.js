'use strict';

const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');

ipcRenderer.on('item-list-updated', (event, items) => {
    console.log('item-list-updated', items);
    const itemList = $('#item-list');
    itemList.empty();
    items.forEach(item => {
        itemList.append(`<li data-id="${item.id}">${item.name}</li>`);
    });
});
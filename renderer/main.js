'use strict';

const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');

$('#back').on('click', ()=>{
    ipcRenderer.send('main-window-back');
});

ipcRenderer.on('item-details-response', (_event, details) => {
    console.log('item-details-response', details);
    // Item containers
    const containersDiv = $('#item-containers');
    containersDiv.empty();
    if(details.parents && details.parents.length > 0){
        details.parents.sort((a,b) => {return b.level - a.level})
        .forEach(parent => {
            containersDiv.append(`<a data-id="${parent.id}">${parent.name}</a>`);
        });
    }
    containersDiv.append(`<a>${details.name}</a>`);
    $('#item-containers a').on('click', function(){
        const itemId = parseInt($(this).data('id'));
        if(!itemId) return;
        ipcRenderer.send('item-details-get', {itemId: itemId});
    });

    // Item main
    $('#item-main h1').text(details.name);
});

ipcRenderer.on('item-list-updated', (_event, items) => {
    console.log('item-list-updated', items);
    const itemList = $('#item-list');
    itemList.empty();
    items.sort((a,b)=> {
        if(a.name.toUpperCase() < b.name.toUpperCase()) {return -1;}
        if(a.name.toUpperCase() > b.name.toUpperCase()) {return 1;}
        return 0;
    }).forEach(item => {
        itemList.append(`<li data-id="${item.id}">${item.name}</li>`);
    });
    $('#item-list li').on('click', function(){
        const itemId = parseInt($(this).data('id'));
        ipcRenderer.send('item-details-get', {itemId: itemId});
    });
});
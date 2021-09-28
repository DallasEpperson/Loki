'use strict';

const { ipcRenderer } = require('electron');
window.Loki = {};
window.$ = window.jQuery = require('jquery');

$('#back').on('click', ()=>{
    ipcRenderer.send('main-window-back');
});

$('#btnNewItem').on('click', ()=>{
    $('#content').addClass('blurred');
    $('#modal-new-item').addClass('modal-open');
    $('#new-item-name').trigger('focus');
});

$('#btnCancelNewItem').on('click', ()=>{
    $('#content').removeClass('blurred');
    $('#modal-new-item').removeClass('modal-open');
});

$('#btnSaveNewItem').on('click', ()=>{
    //todo ensure all required fields are present
    //todo animation on the save button?
    let newItem = {
        name: $('#new-item-name').val()
    };
    ipcRenderer.send('create-item', newItem);
});

$('#btnShowContainerOptions').on('click', ()=>{
    Loki.RenderContainerOptions(Loki.currentItem);
});

$('#btnCancelPickContainer').on('click', ()=>{
    $('#content').removeClass('blurred');
    $('#modal-pick-container').removeClass('modal-open');
});

/**Render item to main window.
 * @param {{
 *  children: [{}],
 *  name: string,
 *  parents: [{
 *   id: number,
 *   level: number,
 *   name: string
 *  }]
 * }} item 
 */
Loki.RenderItem = (item) => {
    $('#pick-item').hide();
    $('#modals .modal').removeClass('modal-open');
    $('#content').removeClass('blurred');
    $('#item').show();

    // Item containers
    const containersList = $('#item-containers ul');
    containersList.empty();
    if(item.parents && item.parents.length > 0){
        item.parents.sort((a,b) => {return b.level - a.level})
        .forEach(parent => {
            containersList.append(`<li data-id="${parent.id}">${parent.name}</li>`);
        });
    }
    $('#item-containers li').on('click', function(){
        const itemId = parseInt($(this).data('id'));
        if(!itemId) return;
        ipcRenderer.send('item-details-get', {itemId: itemId});
    });

    // Item main
    $('#item-main h1').text(item.name);

    // Children
    $('#children').text(`Contains ${item.children.length} objects`);
};

Loki.RenderItemList = () => {
    const itemList = $('#item-list');
    itemList.empty();
    Loki.items.forEach(item => {
        itemList.append(`<li data-id="${item.id}">${item.name}</li>`);
    });
    $('#item-list li').on('click', function(){
        const itemId = parseInt($(this).data('id'));
        ipcRenderer.send('item-details-get', {itemId: itemId});
    });
};

/**Render possible container choices for this item
 * @param {{
 *  children: [{
 *   id: number
 *  }],
 *  id: number
 * }} forItem 
 */
Loki.RenderContainerOptions = (forItem) => {
    const containerOptionList = $('#container-options');
    containerOptionList.empty();
    Loki.items.forEach(potentialContainer => {
        if(forItem.id === potentialContainer.id) return;
        if(forItem.children.filter(child => {return child.id === potentialContainer.id}).length > 0) return;
        containerOptionList.append(`<li data-id="${potentialContainer.id}">${potentialContainer.name}</li>`);
    });
    $('#container-options li').on('click', function(){
        const containerId = parseInt($(this).data('id'));
        ipcRenderer.send('item-place-into-container', {itemId: forItem.id, containerId: containerId});
    });
    $('#content').addClass('blurred');
    $('#modal-pick-container').addClass('modal-open');
};

ipcRenderer.on('item-created', (_event, newItemId)=>{
    //todo cancel animation on the save button?
    $('#content').removeClass('blurred');
    $('#modal-new-item').removeClass('modal-open');
    console.log('item created', newItemId);
});

ipcRenderer.on('item-details-response', (_event, details) => {
    Loki.currentItem = details;
    Loki.RenderItem(details);
});

ipcRenderer.on('item-list-updated', (_event, items) => {
    Loki.items = items.sort((a,b)=> {
        if(a.name.toUpperCase() < b.name.toUpperCase()) {return -1;}
        if(a.name.toUpperCase() > b.name.toUpperCase()) {return 1;}
        return 0;
    });
    Loki.RenderItemList();
});
const Store = require('electron-store');

class AppDataStore extends Store {
    constructor (settings){
        super(settings);
        
        //get from app data file or initialize with defaults
        this.previouslyOpened = this.get('previouslyOpened') || [];
    }

    /**
     * @returns {[string]} Array of previously opened files
     */
    getPreviouslyOpened(){
        return this.previouslyOpened;
    }

    savePreviouslyOpened(){
        this.set('previouslyOpened', this.previouslyOpened);
    }

    addPreviouslyOpened(fileLoc){
        this.previouslyOpened = [fileLoc, ...this.previouslyOpened];
        this.savePreviouslyOpened();
    }

    save(){
        console.log('Saving app data');
        this.savePreviouslyOpened();
    }
};

module.exports = AppDataStore;
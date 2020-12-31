'use strict';

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

var db, fileLoc;

/**Executes a SQL statement.
 * @param {string} sql SQL statement to execute, may contain ? characters.
 * @param {[*]} params Array of items to inject into ? characters.
 * @returns {Promise<void>} Promise resolving only if the SQL execution was successful.
 */
const runSql = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error running sql');
                console.error(err);
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

const createDb = function () {
    db = new sqlite3.Database(fileLoc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    return Promise.resolve()
    .then(function(){
        return runSql(`
            CREATE TABLE IF NOT EXISTS 'item' (
                'id' INTEGER NOT NULL DEFAULT 0 PRIMARY KEY AUTOINCREMENT UNIQUE,
                'containerId' INTEGER,
                'name' TEXT NOT NULL,
                FOREIGN KEY('containerId') REFERENCES 'item' )
        `);
    }).then(function(){
        return runSql(`
            CREATE TABLE IF NOT EXISTS 'item_property' (
                'id' INTEGER NOT NULL DEFAULT 0 PRIMARY KEY AUTOINCREMENT UNIQUE,
                'propertyId' INTEGER NOT NULL,
                'itemId' INTEGER NOT NULL,
                'value' TEXT NOT NULL,
                FOREIGN KEY('propertyId') REFERENCES 'property'('id'),
                FOREIGN KEY('itemId') REFERENCES 'item'('id') )
        `);
    }).then(function(){
        return runSql(`
            CREATE TABLE IF NOT EXISTS 'property' (
                'id' INTEGER NOT NULL DEFAULT 0 PRIMARY KEY AUTOINCREMENT UNIQUE,
                'name' TEXT NOT NULL )
        `);
    });
};

class LokiFile {
    constructor(fileLocation) {
        fileLoc = fileLocation;
    };

    async init() {
        console.log('initializing LokiFile');
        console.log('checking for existence of', fileLoc);
        if (fs.existsSync(fileLoc)) {
            console.log('opening', fileLoc);
            //todo open it
        } else {
            console.log('creating', fileLoc);
            await createDb(fileLoc);
            console.log('finished creating.');
        }
    };
};

module.exports = LokiFile;
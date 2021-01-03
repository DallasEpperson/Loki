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
};

/**
 * 
 * @param {string} sql SQL query to execute, may contain ? characters.
 * @param {[*]} params Array of items to inject into ? characters.
 * @return {Promise<[any]>} Promise resolving to the result set rows.
 */
const getRows = function (sql, params = []){
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('getRows() error running sql.');
                console.error(err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

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

const openDb = function(){
    db = new sqlite3.Database(fileLoc, sqlite3.OPEN_READWRITE);
};

/**Checks if DB is in Loki format.
 * @returns {Promise<void>} Promise resolving if DB is in Loki format.
 */
const checkDb = function(){
    console.log('TODO check DB.');
    return Promise.resolve();
};

const getItemsList = function(){
    return getRows('select id, name from item;')
    .then(function(rows){
        console.log(rows);
        return rows;
    });
};

class LokiFile {
    constructor(fileLocation) {
        fileLoc = fileLocation;
    };

    async init() {
        if (fs.existsSync(fileLoc)) {
            openDb();
            await checkDb();
        } else {
            await createDb(fileLoc);
        }
    };

    getItems() {
        return getItemsList();
    }
};

module.exports = LokiFile;
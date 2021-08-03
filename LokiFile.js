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

const createDb = async function () {
    db = new sqlite3.Database(fileLoc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    await runSql(`
            CREATE TABLE IF NOT EXISTS 'item' (
                'id' INTEGER NOT NULL DEFAULT 0 PRIMARY KEY AUTOINCREMENT UNIQUE,
                'containerId' INTEGER,
                'name' TEXT NOT NULL,
                FOREIGN KEY('containerId') REFERENCES 'item' )
        `);
    await runSql(`
            CREATE TABLE IF NOT EXISTS 'item_property' (
                'id' INTEGER NOT NULL DEFAULT 0 PRIMARY KEY AUTOINCREMENT UNIQUE,
                'propertyId' INTEGER NOT NULL,
                'itemId' INTEGER NOT NULL,
                'value' TEXT NOT NULL,
                FOREIGN KEY('propertyId') REFERENCES 'property'('id'),
                FOREIGN KEY('itemId') REFERENCES 'item'('id') )
        `);
    return await runSql(`
            CREATE TABLE IF NOT EXISTS 'property' (
                'id' INTEGER NOT NULL DEFAULT 0 PRIMARY KEY AUTOINCREMENT UNIQUE,
                'name' TEXT NOT NULL )
        `);
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

    /**Add new item to the database.
     * @param {{
     *  name: string
     * }} item Item to insert.
     * @returns {Promise<number>} Promise resolving to the ID of the new item.
     */
    async addItem(item){
        let sqlQuery = `
            INSERT INTO 'item' ('name') VALUES (?);
            SELECT id FROM 'item' WHERE ROWID = last_insert_rowid();`;
        let sqlResult = await getRows(sqlQuery, [item.name]);
        return;// sqlResult[0][0].id;
        //TODO figure out why sqlResult is always empty array. Perhaps db.all only returns first result set.
    };

    /**Get all items in the DB.
     * @returns {Promise<[{
     *  id: number,
     *  name: string
     * }]>} Promise resolving to array of items.
     */
    async getItems() {
        return await getRows('select id, name from item;');
    };

    /**Get details of an item.
     * @param {number} itemId Item ID.
     * @returns {Promise<{
     *  children: [{
     *   id: number,
     *   name: string,
     *   containerId: number,
     *   level: number
     *  }],
     *  id: number,
     *  name: string,
     *  parents: [{
     *   id: number,
     *   name: string,
     *   containerId: number,
     *   level: number
     *  }],
     *  properties: [{
     *   propertyId: number,
     *   value: string
     *  }]
     * }>} Promise resolving to details of the item.
     */
    getItem(itemId){
        let dbPromises = [];
        dbPromises.push(getRows('select name from item where id = ?;', [itemId]));
        dbPromises.push(getRows('select propertyId, value from item_property where itemId = ?;', [itemId]));
        dbPromises.push(getRows(`
        with recursive cte (id, name, containerId, level) as (
            select id,
                   name,
                   containerId,
                   0
            from item
            where id = ?
            union all
            select i.id,
                   i.name,
                   i.containerId,
                   level + 1
            from item i
            inner join cte on i.id = cte.containerId
        )
        select id, name, containerId, level from cte where level > 0;
        `, [itemId])); //parents
        dbPromises.push(getRows(`
        with recursive cte (id, name, containerId, level) as (
            select id,
                   name,
                   containerId,
                   1
            from item
            where containerId = ?
            union all
            select i.id,
                   i.name,
                   i.containerId,
                   level + 1
            from item i
            inner join cte on i.containerId = cte.id
            )
            select * from cte;
        `, [itemId])); //children
        return Promise.all(dbPromises)
        .then(function(results){
            const dbItemInfo = results[0][0];
            const dbItemProperties = results[1];
            const dbItemParents = results[2];
            const dbItemChildren = results[3];
            return {
                id: itemId,
                name: dbItemInfo.name,
                properties: dbItemProperties,
                parents: dbItemParents,
                children: dbItemChildren
            };
        });
    };
};

module.exports = LokiFile;
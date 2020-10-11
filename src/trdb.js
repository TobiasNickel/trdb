const fs = require('fs');

module.exports.newFileDB = createTobiasRapidDatabase;
module.exports.newAutoIncrementId = newAutoIncrementId;
module.exports.uuid = uuid;
module.exports.deepClone = deepClone;
module.exports.newDeferrer = newDeferrer;

const defaultOptions = {
    idName: 'id',
    newId: uuid,
};

/**
 * @typedef NewDBOptions
 * @property {string} [idName]
 * @property {function} [newId] 
 */

/**
 * 
 * @param {string} filePath
 * @param {NewDBOptions} [options] 
 */
async function createTobiasRapidDatabase(filePath, options) {
    const {
        idName,
        newId, 
    } = { ...defaultOptions, ...options };
    const db = {
        data: await loadData(filePath),

        /**
         * @template T
         * 
         * @param {string} collectionName
         */
        collection(collectionName) {
            if (!db.data[collectionName]) db.data[collectionName] = [];

            const collection = {
                /**
                 * 
                 * @param {Partial<T>} attrs 
                 */
                async find(attrs) {
                    return where(db.data[collectionName], attrs).map(item => {
                        return { ...item };
                    });
                },

                /**
                 * 
                 * @param {Partial<T>} attrs 
                 */
                async findOne(attrs) {
                    return (await collection.find(attrs))[0];
                },

                /**
                 * 
                 * @param {Partial<T>} item 
                 * @returns {Promise<T>}
                 */
                async insert(item) {
                    /** @type {T} */
                    // @ts-ignore
                    const clone = deepClone(item);

                    clone[idName] = newId(db.data[collectionName], idName);

                    if (item[idName]) {
                        throw Error(idName + ' already exist');
                    }
                    db.data[collectionName].push(clone);
                    await saveData(filePath, db.data);
                    return { ...clone };
                },

                /**
                 * 
                 * @param {Array<Partial<T>>} items
                 */
                async insertMany(items) {
                    return await Promise.all(items.map(item => collection.insert(item)));
                },

                /**
                 * 
                 * @param {T} item 
                 */
                async save(item) {
                    const existing =  where(db.data[collectionName], {
                        [idName]: item[idName]
                    })[0];
                    if (!existing) {
                        throw new Error('not found');
                    }
                    Object.assign(existing, item);

                    await saveData(filePath, db.data);
                },

                async remove(attrs) {
                    const removeItems = where(db.data[collectionName], attrs);
                    db.data[collectionName] = db.data[collectionName].filter(entry => !removeItems.includes(entry));
                    await saveData(filePath, db.data);
                },
            };

            saveData(filePath, db.data).catch(err => console.log(err));

            return collection;
        }
    };

    return db;
}

/**
 * @template T
 * @param {Array<T>} array 
 * @param {Partial<T>} attrs
 * @return Array<T> 
 */
function where(array, attrs) {
    return array.filter(item => match(item, attrs));
}

/**
 * 
 * @param {Partial<any>} item 
 * @param {Partial<any>} attrs 
 */
function match(item, attrs) {
    for (const a in attrs) {
        if (Array.isArray(attrs[a]) ? !attrs[a].includes(item[a]) : attrs[a] !== item[a]) {
            return false
        }
    }
    return true;
}

/**
 * @typedef Deferrer
 * @property {function} resolve
 * @property {function} reject
 * @property {Promise} promise
 */

/**
 * @returns {Deferrer}
 */
function newDeferrer() {
    var resolve, reject;

    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return { promise, resolve, reject };
}

/**
 * 
 * @param {string} filePath 
 */
async function loadData(filePath) {
    try {
        return JSON.parse(await (await fs.promises.readFile(filePath)).toString())
    } catch (err) {
        return {};
    }
}

/** @type {{[x: string]: Deferrer}} */
var saveProcesses = {};

/**
 * 
 * @param {string} filePath 
 * @param {any} data 
 */
async function saveData(filePath, data, final = false) {
    if (saveProcesses[filePath]) {
        await saveProcesses[filePath].promise
        if (!final) {
            await saveData(filePath, data, true);
        }
    } else {
        const myDeferrer = saveProcesses[filePath] = newDeferrer();
        await fs.promises.writeFile(filePath, JSON.stringify(data, undefined, '  '));
        delete saveProcesses[filePath];
        myDeferrer.resolve();
    }
}

/**
 * 
 * @param {number} length 
 */
function randomHex(length, _end = '') {
    const f = Math.floor(Math.random() * 0xfffffffffffff).toString(16) + _end;
    if (f.length < length) {
        return randomHex(length, f);
    }
    return f.substr(0, length);
}

/**
 * implementation of uuidv4
 **/
function uuid(...any) {
    const haxArr = randomHex(36).split('');
    haxArr[23] = haxArr[18] = haxArr[13] = haxArr[8] = '-';
    haxArr[14] = '4';
    haxArr[19] = (parseInt(haxArr[19]) & 3 | 8).toString(16);
    return haxArr.join('');
}

/**
 * 
 * @param {any[]} collection
 * @return number  
 */
function newAutoIncrementId(collection, idName){
    if (!collection.length) {
        return 1;
    }
    return (Math.max(...collection.map(entry => entry[idName])) || 0)+1;
}

/**
 * @template T
 * @param {T} obj 
 * @returns {T}
 */
function deepClone(obj) {
    if (typeof obj !== 'object') return obj;
    // @ts-ignore
    if(Array.isArray(obj)) return obj.map(deepClone);
    if (obj instanceof Date) {
        const date = new Date();
        date.setTime(obj.getTime());
        // @ts-ignore
        return date;
    }
    const result = {};
    Object.keys(obj).forEach(k=>{
        result[k] = deepClone(obj[k]);
    });

    // @ts-ignore
    return result;
}
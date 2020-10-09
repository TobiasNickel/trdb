const fs = require('fs');


/**
 * 
 * @param {string} filePath 
 */
module.export = async function createTobiasRapidDatabase(filePath) {
    const db = {
        data: await loadData(filePath),

        /**
         * 
         * @param {string} collectionName
         * @param {string} idName 
         */
        collection(collectionName, idName = 'id'){
            if(!db.data[collectionName]) db.data[collectionName] = [];

            const collection = {
                async find(options){
                    return where(db.data[collectionName], attrs).map(item => {
                        return {...item};
                    });
                },
                async findOne(options){
                    return (await collection.find(options))[0];
                },
                async insert(item){
                    const clone = { ...item, [idName]: uuid() };
                    if(item[idName]){
                        throw Error(idName + 'already exist');
                    }
                    db.data[collectionName].push(clone);
                    await saveData(filePath, db.data);
                    return {...clone};
                },
                async insertMany(items) {
                    return Promise.all(items.map(item => collection.insert(item)));
                },
                async removeWhere(options){
                    const removeItems = where(db.data[collectionName], options);
                    db.data[collectionName] = db.data[collectionName].filter(entry=>!removeItems.includes(entry));
                    await saveData();
                },
            };

            return collection;
        }
    };

    return db;
}

/**
 * 
 * @param {Array<T>} array 
 * @param {*} attrs
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
function match(item, attrs){
    for(const a in attrs){
        if(attrs[a] !== item[a]){
            return false
        }
    }
    return true;
}

function newDeferrer(){
    var resolve, reject;
    const p = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    
    p.resolve = resolve;
    p.reject = reject;

    return deferrer;
}

/**
 * 
 * @param {string} filePath 
 */
async function loadData (filePath) {
    try {
        return JSON.parse(await fs.promises.readFile(filePath))
    } catch(err) {
        return {};
    }
}

/**
 * 
 * @param {string} filePath 
 * @param {any} data 
 */
var saveProcesses = {};
async function saveData(filePath, data, final = false) {
    if(saveProcesses[filePath]){
        await saveProcesses[filePath]
        if(!final){
            await saveData(filePath, data, true);
        }
    }else {
        const myDeferer = saveProcesses[filePath] = newDeferrer();
        await fs.promises.writeFile(filePath, JSON.stringify(data, undefined, '  '));
        delete saveProcesses[filePath];
        myDeferer.resolve();
    }
}

/**
 * 
 * @param {number} length 
 */
function randomHex(length, _end = ''){
    const f = parseInt(Math.random() * 0xfffffffffffff).toString(16) + _end;
    if(f.length<length){
        return randomHex(length, f);
    }
    return f.substr(0, length);
}

/**
 * implementation of uuidv4
 **/
function uuid() {
    const haxArr = randomHex(36).split('');
    haxArr[23]=haxArr[18]=haxArr[13]=haxArr[8]='-';
    haxArr[14]='4';
    haxArr[19]=(parseInt(haxArr[19]) & 3 | 8).toString(16);
    return haxArr.join('');
}
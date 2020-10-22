import * as fs from 'fs';

type TOptions = {
    idName?: string;
    newId?: (collection?: any[], idName?: string) => string | number
}

type TSchema<TT> = {
    [x in keyof TT]: true
}

type TDbData = {
    [x: string]: any[]
}

export function newFileDB(filePath: string, options?: TOptions) {
    const {
        idName = 'id',
        newId = uuid,
    }: TOptions = { ...(options || {}) };

    const db = {
        data: {} as TDbData,
        connected: loadData(filePath).then(async data => {
            db.data = { ...db.data, ...data };
            await saveData(filePath, db.data);
        }),

        collection<T>(collectionName: string) {
            if (!db.data[collectionName]) db.data[collectionName] = [];

            // const fieldNames = Object.keys(schema || {});

            const collection = {

                async find(attrs: TAttribute<T>): Promise<T[]> {
                    return where(db.data[collectionName], attrs).map(item => {
                        return { ...item };
                    });
                },


                async findOne(attrs: TAttribute<T>) {
                    return (await collection.find(attrs))[0];
                },

                async insert(item: Partial<T>): Promise<T> {
                    const clone = {
                        [idName]: newId(db.data[collectionName], idName),
                        ...deepClone(item),
                    } as any;

                    if (item[idName]) {
                        throw Error(idName + ' already exist');
                    }
                    db.data[collectionName].push(clone);
                    await saveData(filePath, db.data);
                    return { ...clone };
                },

                async insertMany(items: Array<Partial<T>>) {
                    return await Promise.all(items.map(item => collection.insert(item)));
                },

                async save(item: T) {
                    const existing = where(db.data[collectionName], {
                        [idName]: item[idName]
                    })[0];
                    if (!existing) {
                        throw new Error('not found');
                    }

                    // todo: implement deep assign
                    Object.assign(existing, item);

                    await saveData(filePath, db.data);
                },

                async remove(attrs: TAttribute<T>) {
                    const removeItems = where(db.data[collectionName], attrs);
                    db.data[collectionName] = db.data[collectionName].filter(entry => !removeItems.includes(entry));
                    await saveData(filePath, db.data);
                },
            };

            // require typescript 4.1
            // fieldNames.forEach(fieldName => {
            //     const FieldName = fieldName[0].toUpperCase() + fieldName.substr(1);
            //     collection['getBy' + FieldName] = (value) => {
            //         // @ts-ignore
            //         return collection.find({ [fieldName]: value });
            //     }
            //
            //     collection['getOneBy' + FieldName] = (value) => {
            //         // @ts-ignore
            //         return collection.findOne({ [fieldName]: value });
            //     }
            // });

            return collection;
        }
    };

    db.connected.then(() => {
        fs.watch(filePath, {}, async (eventType, fileName) => {
            if (saveProcesses[filePath]) return;
            if (justSavedFiles[filePath]) {
                justSavedFiles[filePath] = false;
                return;
            };
            const newData = await loadData(filePath);
            db.data = newData;
        });
    })

    return db;
}

type TAttribute<T> = { [x in keyof T]?: T[x] | T[x][]; }

function where<T>(array: T[], attrs: TAttribute<T>) {
    return array.filter(item => match(item, attrs));
}

function match<T>(item: T, attrs: TAttribute<T>) {
    for (const a in attrs) {
        const v = attrs[a];
        if (Array.isArray(v) ? !v.includes(item[a]) : v !== item[a]) {
            return false
        }
    }
    return true;
}

type TDeferrer<T> = {
    resolve: (value?: T) => void
    reject: (err: Error | any) => void
    promise: Promise<T>
};


export function newDeferrer<T>(): TDeferrer<T> {
    var resolve, reject;

    const promise = new Promise((
        _resolve: (value?: T) => void,
        _reject: (reason?: Error | any) => void
    ) => {
        resolve = _resolve;
        reject = _reject;
    });

    return { promise, resolve, reject };
}

async function loadData(filePath: string) {
    try {
        return JSON.parse(await (await fs.promises.readFile(filePath)).toString())
    } catch (err) {
        return {};
    }
}


var saveProcesses: { [x: string]: TDeferrer<void> } = {};
var justSavedFiles: { [x: string]: boolean } = {};

async function saveData(filePath: string, data: any, final = false) {
    if (saveProcesses[filePath]) {
        await saveProcesses[filePath].promise
        if (!final) {
            await saveData(filePath, data, true);
        }
    } else {
        const myDeferrer = saveProcesses[filePath] = newDeferrer();
        await fs.promises.writeFile(filePath, JSON.stringify(data, undefined, '  '));
        delete saveProcesses[filePath];
        justSavedFiles[filePath] = true;
        myDeferrer.resolve();
    }
}

function randomHex(length: number, _end = ''): string {
    const f = Math.floor(Math.random() * 0xfffffffffffff).toString(16) + _end;
    if (f.length < length) {
        return randomHex(length, f);
    }
    return f.substr(0, length);
}


export function uuid(...any): string {
    const haxArr = randomHex(36).split('');
    haxArr[23] = haxArr[18] = haxArr[13] = haxArr[8] = '-';
    haxArr[14] = '4';
    haxArr[19] = (parseInt(haxArr[19]) & 3 | 8).toString(16);
    return haxArr.join('');
}

export function newAutoIncrementId(collection: any[], idName: string = 'id') {
    if (!collection.length) {
        return 1;
    }
    return (Math.max(...collection.map(entry => entry[idName])) || 0) + 1;
}


export function deepClone<T>(obj: T): T {
    if (typeof obj !== 'object') return obj;
    // @ts-ignore
    if (Array.isArray(obj)) return obj.map(deepClone);
    if (obj instanceof Date) {
        const date = new Date();
        date.setTime(obj.getTime());
        // @ts-ignore
        return date;
    }
    const result = {};
    Object.keys(obj).forEach(k => {
        result[k] = deepClone(obj[k]);
    });

    // @ts-ignore
    return result;
}
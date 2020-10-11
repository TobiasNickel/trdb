# trdb
Tobias Rapid Database

Rapid for rapid prototyping. The idea is, to instantly start coding and care about the database later. Trdb will store data into a json file. There are similar solutions already:

 - `lowdb`: expose all methods available in lodash.js, when an api get implemented using its sync API it can not easily migrate to a more sophisticated datastore. When query lowdb, and mutate the object without saving it back, but updating some other data through its api, the mutation can still end up in the db - because the data is not cloned, when insert or query.
 - `tFileMonk`: A mongo compatible API, that store into a JS file. But the solution I made is kind of hacked and is likely to break when any of its dependencies has updates. Two times when I started an app, I had to debug this solution. Also, this solution relied on having the app call periodically the persist (store to file) method or find a better solution.

I want something that can easily added as db. That has a fully async API, so the module can easily be changed to mongo or SQL db implementations of a very simplistic API. When developing with this file database, you can still access the data directly, but the purpose is to have a limited API, not be full featured.

The module works good in js and typescript.

This db got started when I studied oauth. In oauth, you have communication between clients and servers and servers and servers. So you need a few server apps. For studying, each server should have its own small db. 

# usage
import new db:
```js
const { newFileDB } = require('trdb');

// or in typescript:
import { newFileDB } from 'trdb';
```

then use it:
```js
const db = await newFileDB('./db.json');

const users = db.collection('users');

const user = await users.insert({
    name: 'Tobias Nickel',
    job: 'technical lead',
});

user.favoriteHobby = 'programming';
await users.save(user);

await users.insertMany([
    {
        name: 'Sebastian Sanchez',
    },
    {
        name: 'Firat Evander',
    },
    {
        name: 'Silpa Janz',
    }
]);

const userReloaded = await users.findOne({id: user.id});
console.log(user !== userReloaded); // true

const searchedUsers = await users.find({ name: ['Firat Evander', 'Tobias Nickel']});
console.log(searchedUsers.length); // 2

await users.remove({ name: 'Tobias Nickel' });
await users.remove({ id: user.id });

```

# API
This is the API as printed from typescript. You see, there is not much to it.
```ts
{
    newFileDB(filePath: string, options?: {
        idName: string, // default id
        newId: function, // uuid, it get passed the collection and idName, you can use the newAutoIncrementId method exported by this module.
    }): Promise<{
        data: any;
        collection<T>(collectionName: string): {
            find(attrs: Partial<T>): Promise<T[]>;
            findOne(attrs: Partial<T>): Promise<T>;
            insert(item: Partial<...>): Promise<...>;
            insertMany(items: Partial<...>[]): Promise<...>;
            save(item: T): Promise<...>;
            remove(attrs: any): Promise<...>;
        };
    }>, 
    newAutoIncrementId,
    uuid,
    deepClone,
    newDeferrer,
}
```

# expectations:
This module is developed out of a need, it might still be changed, but when there are breaking API changes it follows the semver versioning. 

let's get coding
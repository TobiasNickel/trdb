# trdb
Tobias Rapid Database

Rapid for rapid prototyping. The idea is, to instantly start coding and care about the database later. Trdb will store data into a json file. There are similar solutions already:

 - `lowdb`: expose all methods available in lodash.js, when an api get implemented using its sync API it can **not** easily migrate to a more sophisticated datastore. When query lowdb, and mutate the object without saving it back, but updating some other data through its API, the mutation can still end up in the db - because the data is not cloned, when insert or query, this can cause problems when you before returning the object to the client, add some statistics infos or related items to the object.

 - `tFileMonk`: A mongo compatible API, that store into a JS file. But the solution I made is kind of hacked and is likely to break when any of its dependencies has updates. Two times when I started a new prototype, I had to debug this solution. Also, this solution relied on having the app call periodically the persist (store to file) method.

 - `sqlite3` Sqlite and sql.js are nice solutions if you want sqlite files. When starting out an app, I think working on a json file, can be much quicker, but it is a personal preference.

 - `json-server` A restAPI for a JSON file and is based on lowdb. It allow frontend developers to start developing the app, before the actual API is ready. And with `tdrb`, a node.js developer can start developing the server side, before the database is ready setup.

I want something that can easily added as db. That has a fully async API, so the module can easily be changed to mongo or SQL db implementations of a very simplistic API. When developing with this file database, you can still access the data directly, but the purpose is to have a limited API, not be full featured.

This db got started when I studied oauth. In oauth, you have communication between clients and servers and servers and servers. So you need a few server apps. For studying, each server should have its own small db. For such case, small JSON-file databases are great.

# usage
This module is made using typescript, the API is small, simple and I hope without surprises. It is designed to be easily replaced by any other datastore. So this module might not give you all nitty gritty features with very fancy searching, but again, that is to make sure, your prototype can easily get migrated to a real project.

import new db:
```js
const { newFileDB } = require('trdb');

// or in typescript:
import { newFileDB } from 'trdb';
```

Then use it. these examples present the complete API.:
```js
// create a db
const db = newFileDB('./db.json');

// create a collection
const users = db.collection('users');

// insert a user (see without id!)
const user = await users.insert({
    name: 'Tobias Nickel',
    job: 'technical lead',
});

// update and save the user
user.favoriteHobby = 'programming';
await users.save(user);

// update many or update without loading the item from db.
// update job where name is Tobias Nickel.
await users.update({name: 'Tobias Nickel'}, { job: 'superstar' });

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

// When inserting or saving, internally a new copy of the object is created
// next the reloaded user represents the same user in DB, but is a separate object.
// this is the same behavior you get from a real databases or API.
const userReloaded = await users.findOne({id: user.id});
console.log(user !== userReloaded); // true

// pass in the properties all the resulting items should have.
// also allow to pass arrays for then the objects value need to be included.
const searchedUsers = await users.find({ name: ['Firat Evander', 'Tobias Nickel']});
console.log(searchedUsers.length);

// removing items just works just like search, if first search then removes.
await users.remove({ name: 'Tobias Nickel' });
await users.remove({ id: user.id });

// Feel free to create multiple dbs to put collections in separate files.
// This example also shows the options for custom idName and
// newId. This the newId defaults to uuid v4, and provides a method for
// generating autoIncrementIds. You can implement your own ID functions,
// returning and primitive like numbers and strings. 
const postsDB = newFileDB('posts.json', {
    idName: 'postId',
    newId: newAutoIncrementId
});
const posts = db.collection('posts');
```

This is all the API presented. Also, this module, will watch the json file. And if you or an other process will update the json-file. It get reloaded and populated in the db running process. This is very handy when inserting dummy data for test and quickly delete again. This will make your prototyping faster.

Currently there is no mechanism to close the db. Meaning that the file will be watched for the runtime of the process/server. Because of that, you should not use this module to access lots and lots of json-files. For that, just read and parse the files as json using the `fs` module. Trdb is meant to mimic a DB.

There was the idea, to have separate files for separate collections. But this does not need to be implemented by this library, as you can have a separate `db` for a collection.

# expectations:
This module is developed out of a need, it might still be changed, but when there are breaking API changes it follows the semver versioning. currently the code has 100% test-coverage measured with `nyc`.

# update 0.0.5
There is a new optional second parameter for the collection method. This parameter is absolutely not used by the code. However, it can help to provide types, without using typescript. The next example is in javascript:

```js
const baseExample = {
    id: '', // type string
};
// create a db
const db = newFileDB('./db.json');

// create a collection
const users = db.collection('users', { name: '', ...baseExample });

const myUser = await users.findOne({ name: 'tobias' }); // ts tell you that name is a valid prop

myUser. // when using myUser. the editor will offer id and name.
```


let's get coding
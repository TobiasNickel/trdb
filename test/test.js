const { newFileDB, newAutoIncrementId } = require('../src/trdb.js');
const fs = require('fs');
const tmpTestFile = __dirname+'/tmpTestDB.json';
const assert = require('assert');

main().catch(err=>console.log(err)).then(()=>process.exit());
async function main() {
    try{ await fs.promises.unlink(tmpTestFile); }catch(err){}
    const db = await newFileDB(tmpTestFile, { newId: newAutoIncrementId });
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

    const searchedUsers = await users.find({ name: ['Firat Evander', 'Tobias Nickel']});
    assert.equal(searchedUsers.length, 2, 'find two user');

    await users.remove({name: 'Firat Evander'});

    const searchedUsers2 = await users.find({ name: ['Firat Evander', 'Tobias Nickel']});
    assert.equal(searchedUsers2.length, 1, 'find two user');

    //await fs.promises.unlink(tmpTestFile);
    console.log('done')
}


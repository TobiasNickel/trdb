import { newFileDB, newAutoIncrementId, deepClone } from '../src/trdb';
import * as fs from 'fs';
import { assert } from 'console';

const tmpTestFile = __dirname+'/tmpTestDB.json'
const tmpTestFile2 = __dirname+'/tmpTestDB2.json'


interface IUser{
    name: string;
    job: string; 
    id: string; 
    favoriteHobby:string;
    created: Date;
}

main().catch(err=>console.log(err)).then(()=>process.exit());
async function main(){
    try{ await fs.promises.unlink(tmpTestFile); }catch(err){}
    const db = newFileDB(tmpTestFile);
    const users = db.collection<IUser>('users');
    const postsDB = newFileDB(tmpTestFile2, {
        idName: 'postId',
        newId: newAutoIncrementId
    });
    const posts = db.collection('posts');

    db.collection<IUser>('users');

    const user = await users.insert({
        name: 'Tobias Nickel',
        job: 'technical lead',
        created: new Date(),
    });

    user.favoriteHobby = 'programming';
    await users.save(user);

    try{ await users.save({} as any); }catch(err){}
    try{ await users.insert({id: 'a'}); }catch(err){}

    await users.insertMany([
        {
            name: 'Sebastian Sanchez',
        },
        {
            name: 'Fırat Evander'
        }
    ]);

    await users.findOne({name: 'Tobias Nickel'})
    
    await users.findOne({id:['123']});
    await users.remove({id:''});
    
    await users.update({
        name: 'Fırat Evander'
    }, {job:'software architect'});

    const firat = await users.findOne({
        name: 'Fırat Evander'
    });
    assert(firat.job = 'software architect', 'update did not work');


    fs.writeFileSync(tmpTestFile, JSON.stringify(db.data));
    await new Promise(resolve=>setTimeout(resolve, 100));

    await Promise.all([
        users.insert({}),
        users.insert({}),
        users.insert({}),
    ]);

    newAutoIncrementId([], 'id')
    newAutoIncrementId([{id:0}])
    newAutoIncrementId([{id:1}])

    deepClone([]);


    await fs.promises.unlink(tmpTestFile);
    await fs.promises.unlink(tmpTestFile2);

    console.log('done')
}
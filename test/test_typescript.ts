import { newFileDB } from '../src/trdb.js';
const fs = require('fs');
const tmpTestFile = __dirname+'/tmpTestDB.json'


interface IUser{
    name: string;
    job: string; 
    id: string; 
    favoriteHobby:string;
}

main().catch(err=>console.log(err)).then(()=>process.exit());
async function main(){
    try{ await fs.promises.unlink(tmpTestFile); }catch(err){}
    const db = await newFileDB(tmpTestFile);
    const users = db.collection<IUser>('users');

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
            name: 'Fırat Evander'
        }
    ]);

    await fs.promises.unlink(tmpTestFile);
    console.log('done')
}
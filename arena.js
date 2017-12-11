process.title = "discordarena";

//Discord.js Integration
const Discord = require('discord.js');
const client = new Discord.Client();
var server = null;

//MongoDB Integration
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/arena';
const dbName = 'arena';
const colName = 'characters';

////Connect to database
//(async function () {
//    let dbClient;
//    try {
//        dbClient = await MongoClient.connect(url);
//        console.log("Connected to " + dbName);
//        const db = dbClient.db(dbName);
//        const col = db.collection(colName);
//} catch (err) {
//console.log(err.stack);
//}
//})();
//
//      //Create character
//      await col.insertOne({name: "test",class: "Barbarian",strength: 20});
//      console.log("Character successfully created in"+colName );

//      //Get multiple characters
//      const testfind = col.find({name: "test"}).limit(1);
//      while (await testfind.hasNext()) {
//          const doc = await testfind.next();
//          console.log(doc);
//      }       

//        //Update one character
//        await col.findOneAndUpdate({name: "test"}, {$set: {strength: 28}}, {
//            returnOriginal: false,
//            sort: [['a', 1]],
//            upsert: true
//        });

//        //Get one character
//        const testfind = await col.findOne({name: "test"});
//        console.log(testfind);

//Secret Token from Discord Developers
client.login('Mzg1MzcxNjI2MDg4MzAwNTQ0.DQAY2A.YK6aoMM4ph5G3MIP7pAqgF_kl3U');

client.on('ready', () => {
    console.log('I am ready!');
    server = client.guilds.get("256079257162350602");
    console.log('' + server.name);
    server.channels.find(chan => chan.id === "384709036924469250").send("Arena, ready to serve."); //Changer les 2 ID en fonction de votre chan  

});
client.on('message', message => {

    if (!message.author.bot) {
        const prefix = "!";
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        console.log(args);
        console.log(command);
        if (command === "create") {

            const character = {
                name: message.author.username,
                class: args[0],
                level: parseInt(args[1])
            };
            console.log(character);
            //Connect to database
            (async function () {
                let dbClient;
                try {
                    dbClient = await MongoClient.connect(url);
                    console.log("Connected to " + dbName);
                    const db = dbClient.db(dbName);
                    const col = db.collection(colName);

                    //MongoDB Operations HERE
                    await col.insertOne(character);
                    console.log("Character successfully created in " + colName);

                    const charVerif = await col.findOne({name: message.author.username});
                    console.log(charVerif);
                    message.reply("Bienvenue à toi, " + charVerif.class + " " + charVerif.name + " de niveau " + charVerif.level);
                } catch (err) {
                    console.log(err.stack);
                }
            })();

        }

        if (command === "infos") {
            (async function () {
                let dbClient;
                try {
                    dbClient = await MongoClient.connect(url);
                    console.log("Connected to " + dbName);
                    const db = dbClient.db(dbName);
                    const col = db.collection(colName);
                    
                    const charVerif = await col.findOne({name: message.author.username});
                    console.log(charVerif);
                    if(charVerif===null)
                        message.reply("Vous n'avez pas encore de personnage. Utilisez !create <classe> <niveau>");
                    else
                        message.reply("vous êtes un " + charVerif.class + " de niveau " + charVerif.level);
                } catch (err) {
                    console.log(err.stack);
                }
            })();
        }

    }
});
 
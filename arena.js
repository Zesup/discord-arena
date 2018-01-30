process.title = "discordarena";
//Discord.js Integration
const Discord = require('discord.js');
const client = new Discord.Client();
var server = null;
var channel = null;
//MongoDB Integration
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/arena';
const dbName = 'arena';
////Connect to database
//(async function () {
//    let dbClient;
//    try {
//        dbClient = await MongoClient.connect(url);
//        console.log("Connected to " + dbName);
//        const db = dbClient.db(dbName);
//        const col = db.collection('characters');
//} catch (err) {
//console.log(err.stack);
//}
//})();
//
//      //Create character
//      await col.insertOne({name: "test",class: "Barbarian",strength: 20});
//      console.log("Character successfully created in characters"  );

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

//Secret Token for the Bot (from Discord Developers)
client.login('Mzg1MzcxNjI2MDg4MzAwNTQ0.DQAY2A.YK6aoMM4ph5G3MIP7pAqgF_kl3U');
client.on('ready', () => {
  console.log('I am ready!');
  server = client.guilds.get("256079257162350602");
  console.log(`${server.name}`);
  channel = server.channels.find(chan => chan.id === "384709036924469250");
  channel.send("Arena, ready to serve."); //Changer les 2 ID en fonction de votre chan  

});
client.on('message', message => {

  if (!message.author.bot) {
    const prefix = "!";
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    console.log(args);
    if (command === "create") {
      var character = null;
      switch (args[0]) {
        case "Barbare":
          character = {
            discordID: message.author.id,
            discordName: message.author.username,
            class: args[0],
            statSTR: 7,
            statRES: 5,
            statLUK: 2,
            statAGI: 1
          };
          break;
        case "Aventurier":
          character = {
            discordID: message.author.id,
            discordName: message.author.username,
            class: args[0],
            statSTR: 4,
            statRES: 4,
            statLUK: 4,
            statAGI: 4
          };
          break;
        case "Sorcier":
          character = {
            discordID: message.author.id,
            discordName: message.author.username,
            class: args[0],
            statSTR: 2,
            statRES: 3,
            statLUK: 8,
            statAGI: 3
          };
          break;
        case "Templier":
          character = {
            discordID: message.author.id,
            discordName: message.author.username,
            class: args[0],
            statSTR: 3,
            statRES: 8,
            statLUK: 4,
            statAGI: 1
          };
          break;
        case "Voleur":
          character = {
            discordID: message.author.id,
            discordName: message.author.username,
            class: args[0],
            statSTR: 4,
            statRES: 1,
            statLUK: 4,
            statAGI: 7
          };
          break;
      }
      if (character !== null) {
        //Connect to database
        (async function () {
          let dbClient;
          try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            const col = db.collection('characters');
            //MongoDB Operations HERE
            await col.insertOne(character);
            console.log("Character successfully created in characters");
            const charVerif = await col.findOne({discordName: character.discordName});
            console.log(charVerif);
            message.reply("Bienvenue à toi, " + charVerif.class + " " + charVerif.discordName);
          } catch (err) {
            console.log(err.stack);
            console.log(character);
            message.reply("Erreur NoSQL.");
          }
        })();
      } else
        message.reply("Commande erronée.");
    }

    if (command === "infos") {
      (async function () {
        let dbClient;
        try {
          dbClient = await MongoClient.connect(url);
          console.log("Connected to " + dbName);
          const db = dbClient.db(dbName);
          let replyDM = "";
          let col = db.collection('characters');
          const charVerif = await col.findOne({discordName: message.author.username});
          console.log(charVerif);
          if (charVerif === null)
            replyDM = "Vous n'avez pas encore de personnage.";
          else {
            replyDM += (charVerif.discordName + " - Classe " + charVerif.class + "\n");
            replyDM += ("Force " + charVerif.statSTR + " - Résistance " + charVerif.statRES + " - Agilité " + charVerif.statAGI + " - Chance " + charVerif.statLUK + "\n");
            col = db.collection('items');
            const items = await col.find({characterName: message.author.username});
            if (items === null)
              message.reply("Aucun équipement.");
            else
            {
              var i = 1;
              while (await items.hasNext())
              {
                const obj = await items.next();
                console.log(obj);
                replyDM += ("Item " + i + " : " + obj.itemType + " " + obj.itemName + " - Force " + obj.itemPower + "\n");
                i++;
              }

            }
          }
          message.author.send(replyDM);
        } catch (err) {
          console.log(err.stack);
          message.reply("Erreur NoSQL.");
        }
      })();
    }

    if (command === "additem") {

      const item = {
        itemID: null,
        characterName: message.author.username,
        itemType: args[0],
        itemName: args[1],
        itemPower: parseInt(args[2])
      };
      //Connect to database
      (async function () {
        let dbClient;
        try {
          dbClient = await MongoClient.connect(url);
          console.log("Connected to " + dbName);
          const db = dbClient.db(dbName);
          const col = db.collection('items');
          //Récupération du dernier item en date pour incrémentation de l'ID
          let lastItem = await col.find().sort({itemID:-1}).limit(1).next();
          console.log(lastItem);
          item.itemID = lastItem.itemID + 1;
          await col.insertOne(item);
          console.log("Item successfully created in DB items");
          let replyDM = "";
          const items = await col.find({characterName: message.author.username});
          if (items === null)
            message.reply("Vous n'avez aucun équipement.");
          else
          {
            var i = 1;
            while (await items.hasNext())
            {
              const obj = await items.next();
              console.log(obj);
              replyDM += ("Item " + i + " : " + obj.itemType + " " + obj.itemName + " - Force " + obj.itemPower + "\n");
              i++;
            }
            message.author.send(replyDM);
          }
        } catch (err) {
          console.log(err.stack);
          message.reply("Erreur NoSQL.");
        }
      })();
    }

    if (command === "battle") {
      const enemyName = args[0];
      if (enemyName === "")
        message.reply("Veuillez préciser le nom de votre adversaire. Utilisez !battle <nom adversaire>");
      else
      {
        //Simple comparaison des levels
        (async function () {
          let dbClient;
          try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            const col = db.collection('characters');
            const charVerif = await col.findOne({discordName: message.author.username});
            console.log(charVerif);
            if (charVerif === null)
              message.reply("Vous n'avez pas encore de personnage. Utilisez !create <classe> <niveau>");
            else
            {
              const enemyVerif = await col.findOne({discordName: enemyName});
              console.log(enemyVerif);
              if (enemyVerif === null)
                message.reply("Adversaire introuvable");
              else
              {
                let attackUser = server.members.get(charVerif.discordID);
                let enemyUser = server.members.get(enemyVerif.discordID);
                if (charVerif.level > enemyVerif.level)
                  channel.send(`${attackUser} vient de battre ${enemyUser} !`);
                else
                  channel.send(`${attackUser} vient de se faire battre par ${enemyUser} !`);
              }

            }
          } catch (err) {
            console.log(err.stack);
            message.reply("Erreur NoSQL.");
          }
        })();
      }
    }
  }
});

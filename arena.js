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

//Secret Token for the Bot (from Discord Developers)
client.login('Mzg1MzcxNjI2MDg4MzAwNTQ0.DQAY2A.YK6aoMM4ph5G3MIP7pAqgF_kl3U');

client.on('ready', () => {
  //Changer les 2 ID en fonction de votre channel
  console.log('I am ready!');
  server = client.guilds.get("256079257162350602");
  console.log(`${server.name}`);
  channel = server.channels.find(chan => chan.id === "384709036924469250");
  channel.send("Arena, ready to serve.");
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
            statAGI: 1,
            weaponEquipID: 0,
            armorEquipID: 0
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
            statAGI: 4,
            weaponEquipID: 0,
            armorEquipID: 0
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
            statAGI: 3,
            weaponEquipID: 0,
            armorEquipID: 0
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
            statAGI: 1,
            weaponEquipID: 0,
            armorEquipID: 0
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
            statAGI: 7,
            weaponEquipID: 0,
            armorEquipID: 0
          };
          break;
      }
      if (character !== null) {
        createNewCharacter(message, character);
      } else
        message.reply("Commande erronée.");
    }

    if (command === "infos") {
      getInfos(message);
    }

    if (command === "additem") {
      const item = {
        itemID: null,
        characterName: message.author.username,
        itemType: args[0],
        itemName: args[1],
        itemPower: parseInt(args[2])
      };
      addItemToDB(message, item);
      getInfos(message);
    }

    if (command === "equip") {
      var itemToEquipID = args[0]; //faire une vérification de cast en INT
      equipItem(message, itemToEquipID);
      getInfos(message);
    }

    if (command === "battle") {
      const enemyName = args[0];
      if (enemyName === "")
        message.reply("Veuillez préciser le nom de votre adversaire. Utilisez !battle <nom adversaire>");
      else
      {
        startBattle(message, enemyName);
      }
    }

    message.delete();
  }
}
);

function createNewCharacter(message, character) {
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
}

function getInfos(message) {
  (async function () {
    let dbClient;
    try {
      dbClient = await MongoClient.connect(url);
      console.log("Connected to " + dbName);
      const db = dbClient.db(dbName);
      let replyDM = "";
      let col = db.collection('characters');
      const charVerif = await col.findOne({discordName: message.author.username});
      console.log("infos demandées par :");
      console.log(charVerif);
      if (charVerif === null)
        replyDM = "Vous n'avez pas encore de personnage.";
      else {
        replyDM += (charVerif.discordName + " - Classe " + charVerif.class + "\n");
        replyDM += ("Force " + charVerif.statSTR + " - Résistance " + charVerif.statRES + " - Agilité " + charVerif.statAGI + " - Chance " + charVerif.statLUK + "\n");
        col = db.collection('items');

        if (charVerif.weaponEquipID !== 0)
        {
          let equipedItem = await col.findOne({characterName: message.author.username, itemID: charVerif.weaponEquipID});
          console.log("arme équipée");
          console.log(equipedItem);
          replyDM += ("Arme équipée : " + equipedItem.itemType + " " + equipedItem.itemName + " - Force " + equipedItem.itemPower + "\n");
        } else
          replyDM += "Aucune arme équipée\n";

        if (charVerif.armorEquipID !== 0)
        {
          let equipedItem = await col.findOne({characterName: message.author.username, itemID: charVerif.armorEquipID});
          console.log("armure équipée");
          console.log(equipedItem);
          replyDM += ("Armuree équipée : " + equipedItem.itemType + " " + equipedItem.itemName + " - Force " + equipedItem.itemPower + "\n")
        } else
          replyDM += "Aucune armure équipée\n";

        const items = await col.find({characterName: message.author.username});
        if (items === null)
          message.reply("Aucun équipement.");
        else
        {
          var i = 1;
          while (await items.hasNext())
          {
            const obj = await items.next();
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

function addItemToDB(message, item) {
  (async function () {
    let dbClient;
    try {
      dbClient = await MongoClient.connect(url);
      console.log("Connected to " + dbName);
      const db = dbClient.db(dbName);
      const col = db.collection('items');
      //Récupération du dernier item en date pour incrémentation de l'ID
      let lastItem = await col.find().sort({itemID: -1}).limit(1).next();
      console.log(lastItem);
      item.itemID = lastItem.itemID + 1;
      await col.insertOne(item);
      console.log("Item successfully created in DB items");
    } catch (err) {
      console.log(err.stack);
      message.reply("Erreur NoSQL.");
    }
  })();
}

function equipItem(message, itemToEquipID) {
  (async function () {
    let dbClient;
    try {
      dbClient = await MongoClient.connect(url);
      console.log("Connected to " + dbName);
      const db = dbClient.db(dbName);
      let col = db.collection('items');
      let items = await col.find({characterName: message.author.username}).skip(itemToEquipID - 1);
      if (await items.hasNext())
      {
        let itemToEquip = await items.next();
        console.log("item sélectionné : ");
        console.log(itemToEquip);
        col = db.collection('characters');
        if (itemToEquip.itemType === "Armure")
          await col.updateOne({discordName: message.author.username}, {$set: {armorEquipID: itemToEquip.itemID}});
        else
          await col.findOneAndUpdate({discordName: message.author.username}, {$set: {weaponEquipID: itemToEquip.itemID}});
      }
    } catch (err) {
      console.log(err.stack);
      message.reply("Erreur NoSQL.");
    }
  })();
}

function startBattle(message, enemyName) {
  (async function () {
    let dbClient;
    try {
      dbClient = await MongoClient.connect(url);
      console.log("Connected to " + dbName);
      const db = dbClient.db(dbName);
      const col = db.collection('characters');
      const charVerif = await col.findOne({discordName: message.author.username});
      console.log("attaquant :" + charVerif.discordName);
      if (charVerif === null)
        message.reply("Vous n'avez pas encore de personnage. Utilisez !create <classe> <niveau>");
      else
      {
        const enemyVerif = await col.findOne({discordName: enemyName});
        console.log("défenseur :" + enemyVerif.discordName);
        if (enemyVerif === null)
          message.reply("Adversaire introuvable");
        else
        {
          //Ecriture de l'algorithme de bataille en cours
          message.reply("Bientôt en DLC");
        }
      }
    } catch (err) {
      console.log(err.stack);
      message.reply("Erreur NoSQL.");
    }
  })();
}
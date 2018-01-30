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
    }

    if (command === "equip") {
      var itemToEquipID = args[0]; //faire une vérification de cast en INT
      equipItem(message, itemToEquipID);      
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
          replyDM += ("Armure équipée : " + equipedItem.itemType + " " + equipedItem.itemName + " - Force " + equipedItem.itemPower + "\n")
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
      item.itemID = lastItem.itemID + 1;
      console.log("nouvel item");
      console.log(item);
      await col.insertOne(item);
      console.log("Item successfully created in DB items");
      getInfos(message);
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
      getInfos(message);
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
      let col = db.collection('characters');
      const attacker = await col.findOne({discordName: message.author.username});
      console.log("attaquant :" + attacker.discordName);
      if (attacker === null)
        message.reply("Vous n'avez pas encore de personnage. Utilisez !create <classe> <niveau>");
      else
      {
        const defender = await col.findOne({discordName: enemyName});
        console.log("défenseur :" + defender.discordName);
        if (defender === null)
          message.reply("Adversaire introuvable");
        else
        {
          let attackUser = server.members.get(attacker.discordID);
          let defendUser = server.members.get(defender.discordID);
          channel.send(`Début du combat entre ${attackUser} et ${defendUser} !`);
          
          //Récupération des statistiques des deux joueurs
          let awp = 0;
          let aap = 0;
          let ahp = 10;
          let astr = attacker.statSTR;
          let ares = attacker.statRES;
          let aluk = attacker.statLUK;
          let aagi = attacker.statAGI;
          
          let dwp = 0;
          let dap = 0;
          let dhp = 10;
          let dstr = defender.statSTR;
          let dres = defender.statRES;
          let dluk = defender.statLUK;
          let dagi = defender.statAGI;
           
          //Récupération des statistiques de l'équipement
          col = db.collection('items');
          if (attacker.armorEquipID !== 0)
          {
            let equipedItem = await col.findOne({characterName: attacker.discordName, itemID: attacker.armorEquipID});
            aap = equipedItem.itemPower;
          }

          if (defender.armorEquipID !== 0)
          {
            let equipedItem = await col.findOne({characterName: defender.discordName, itemID: defender.armorEquipID});
            dap = equipedItem.itemPower;
          }

          if (defender.weaponEquipID !== 0)
          {
            let equipedItem = await col.findOne({characterName: defender.discordName, itemID: defender.weaponEquipID});
            dwp = equipedItem.itemPower;
            if (equipedItem.itemType === "Hache" && defender.class === "Barbare") {
              dwp += 2;
            }
            if (equipedItem.itemType === "Lance" && defender.class === "Templier") {
              dwp += 2;
            }
            if (equipedItem.itemType === "Epée" && defender.class === "Voleur") {
              dwp += 2;
            }
            if (equipedItem.itemType === "Magie" && defender.class === "Sorcier") {
              dwp += 2;
            }
            if (equipedItem.itemType === "Magie") {
              aap = 0;
            }
          }

          if (attacker.weaponEquipID !== 0)
          {
            let equipedItem = await col.findOne({characterName: attacker.discordName, itemID: attacker.weaponEquipID});
            awp = equipedItem.itemPower;
            if (equipedItem.itemType === "Hache" && attacker.class === "Barbare") {
              awp += 2;
            }
            if (equipedItem.itemType === "Lance" && attacker.class === "Templier") {
              awp += 2;
            }
            if (equipedItem.itemType === "Epée" && attacker.class === "Voleur") {
              awp += 2;
            }
            if (equipedItem.itemType === "Magie" && attacker.class === "Sorcier") {
              awp += 2;
            }
            if (equipedItem.itemType === "Magie") {
              dap = 0;
            }
          }
          
          //Application des effets
          if (Math.random() < 0.6) //Compétences actives se déclenchent à 60% de chances
          { 
            channel.send(attacker.discordName + " a lancé son skill actif !"); //Insérez ici de meilleures catchprases
            switch (attacker.class)
            {
              case "Barbare":
              {
                astr += 4;
                aagi = 0;
                aluk = 0;
                break;
              }
              case "Aventurier":
              {
                astr += 1;
                aagi += 1;
                aluk += 2;
                ares += 1;
                break;
              }
              case "Sorcier":
              {
                aagi += 2;
                ares += 2;
                break;
              }
              case "Templier":
              {
                ahp = 15;
                break;
              }
              case "Voleur":
              {
                aagi += 5;
                break;
              }

            }
          }
          if (Math.random() < 0.6) //Deux jets différents pour chaque joueur
          {
            channel.send(defender.discordName + " a lancé son skill actif !");
            switch (defender.class)
            {
              case "Barbare":
              {
                dstr += 4;
                dagi = 0;
                dluk = 0;
                break;
              }
              case "Aventurier":
              {
                dstr += 1;
                dagi += 1;
                dluk += 2;
                dres += 1;
                break;
              }
              case "Sorcier":
              {
                dagi += 2;
                dres += 2;
                break;
              }
              case "Templier":
              {
                dhp = 15;
                break;
              }
              case "Voleur":
              {
                dagi += 5;
                break;
              }

            }
          }

          let adam = Math.max(1,astr - dres + awp - dap + aluk / 2); //Dégats de l'attaquant
          let ddam = Math.max(1,dstr - ares + dwp - aap + dluk / 2); //Dégats du défenseur
          let hitModificator = 2 * (aagi - dagi) + aluk - dluk;
          let chancesToHitAtk = 75 + hitModificator;
          let chancesToHitDef = 75 - hitModificator;
          //Début des tours de combat
          let currentRound=0;
          while (ahp * dhp > 0)
          {
            currentRound++;
            //tour de l'attaquant
            let randAttacker = Math.random() * 100;
            let dmgAtkFromRound = 0;
            
            if (chancesToHitAtk > randAttacker )
            {
              dmgAtkFromRound = adam;
              if (dhp > adam)
                dhp -= adam;
              else
                dhp = 0;
            }
            
            //tour du défenseur
            let randDefender = Math.random() * 100;
            let dmgDefFromRound = 0;            
            if (chancesToHitDef > randDefender)
            {
              dmgDefFromRound = ddam;
              if (ahp > ddam)
                ahp -= ddam;
              else
                ahp = 0;
            }
            let roundSummary="Passe d'armes " + currentRound + "\n";
            roundSummary += ( attacker.discordName +" Chances : "+ chancesToHitAtk+ " - Jet d'attaque : " + Math.round(randAttacker)+ " - Dégats infligés : " + dmgAtkFromRound +"\n");
            roundSummary += ( defender.discordName +" Chances : "+ chancesToHitDef+ " - Jet d'attaque : " + Math.round(randDefender)+ " - Dégats infligés : " + dmgDefFromRound +"\n");
            roundSummary += ("Points de vie restants - " + attacker.discordName + " : " + ahp + " / " + defender.discordName + " : " + dhp);
            channel.send(roundSummary);
          }
          
          //Fin du combat
          if (ahp === 0 && dhp === 0)
          {
            channel.send(`${attackUser} ${defendUser} Double KO !`);
          }          
          else if (ahp === 0)
          {
            channel.send(`Victoire de ${defendUser} sur ${attackUser} !`);
          }
          else if (dhp === 0)
          {
            channel.send(`Victoire de ${attackUser} sur ${defendUser} !`);
          }
          
          //Drop des loots après victoire
            /*
              let jet=Math.random();
            let taux=1+Math.pow(2,-(3-aluk/4))+Math.pow(3,-(3-aluk/4))+Math.pow(4,-(3-aluk/4))+Math.pow(5,-(3-aluk/4))+Math.pow(6,-(3-aluk/4));

            let p1=1/(taux);
            let p2=p1+1/(taux*Math.pow(2,-(3-aluk/4)));
            let p3=p2+1/(taux*Math.pow(3,-(3-aluk/4)));
            let p4=p3+1/(taux*Math.pow(4,-(3-aluk/4)));
            let p5=p4+1/(taux*Math.pow(5,-(3-aluk/4)));
            if (jet<p1)
            {}
       */
        }
      }
    } catch (err) {
      console.log(err.stack);
      message.reply("Erreur NoSQL.");
    }
  })();
}
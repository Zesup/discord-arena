process.title = "discordarena";
//Discord.js Integration
const Discord = require('discord.js');
const client = new Discord.Client();
var server = null;
var channel = null;
var emojis = null;

//Customizable Discord Configuration
const botSecretToken = 'Mzg1MzcxNjI2MDg4MzAwNTQ0.DQAY2A.YK6aoMM4ph5G3MIP7pAqgF_kl3U';
const guildID = "256079257162350602";
const channelID = "384709036924469250";

//MongoDB Integration
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/arena';
const dbName = 'arena';

client.login(botSecretToken);
client.on('ready', () => {
    //Changer les 2 ID en fonction de votre channel
    console.log('Arena Bot - Ready!');
    server = client.guilds.get(guildID);
    emojis = server.emojis;
    console.log(`${server.name}`);
    channel = server.channels.find(chan => chan.id === channelID);
    channel.send("Welcome to the Arena.");
});

client.on('message', message => {
    if (!message.author.bot) {
        const prefix = "!";
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        console.log(args);

        if (command === "start") {
            var character = {
                discordID: message.author.id,
                discordName: message.author.username,
                class: args[0],
                statSTR: 0,
                statRES: 0,
                statLUK: 0,
                statAGI: 0,
                weaponEquipID: 0,
                armorEquipID: 0,
                skillPhrase: null,
                victoryPhrase: null,
                defeatPhrase: null
            };
            switch (args[0]) {
                case "Barbare":
                    character.statSTR = 7;
                    character.statRES = 5;
                    character.statLUK = 2;
                    character.statAGI = 1;
                    break;
                case "Aventurier":
                    character.statSTR = 4;
                    character.statRES = 4;
                    character.statLUK = 4;
                    character.statAGI = 4;
                    break;
                case "Sorcier":
                    character.statSTR = 2;
                    character.statRES = 3;
                    character.statLUK = 8;
                    character.statAGI = 3;
                    break;
                case "Templier":
                    character.statSTR = 3;
                    character.statRES = 8;
                    character.statLUK = 4;
                    character.statAGI = 1;
                    break;
                case "Voleur":
                    character.statSTR = 4;
                    character.statRES = 1;
                    character.statLUK = 4;
                    character.statAGI = 7;
                    break;
                default:
                    character = null;
                    break;
            }
            if (character !== null) {
                createNewCharacter(message, character);
            } else
            {
                message.reply("Commande erronée.");
                message.delete();
            }
        }

        if (command === "personnage" || command === "p") {
            getInfosPerso(message);
            message.delete();
        }

        if (command === "additem") { //commande debug qui disparaitra à terme
            const item = {
                itemID: null,
                characterName: message.author.username,
                itemType: args[0],
                itemName: args[1],
                itemPower: parseInt(args[2])
            };
            addItemToDB(message, item);
            message.delete();
        }

        if (command === "equip" || command === "e") {
            var itemToEquipID = args[0]; //faire une vérification de cast en INT
            equipItem(message, itemToEquipID);
            message.delete();
        }
        if (command === "optimize" || command === "op") {
            optimize(message);
            message.delete();
        }
        if (command === "battle") {
            const enemyName = args[0];
            if (enemyName === "")
                message.reply("Tapez !battle <Nom Discord de l'adversaire> pour lancer un combat.");
            else if( enemyName === message.author.username )            
                message.reply("vient de se blesser dans sa confusion");
            else
                startBattle(message, enemyName);
        }

        if (command === "victoryphrase" || command === "vp")
        {
            var phrase = args.join(' ');
            setVictoryPhrase(message, phrase);
        }

        if (command === "skillphrase" || command === "sp")
        {
            var phrase = args.join(' ');
            setSkillPhrase(message, phrase);
        }

        if (command === "defeatphrase" || command === "dp")
        {
            var phrase = args.join(' ');
            setDefeatPhrase(message, phrase);
        }

        if (command === "help" || command === "h")
        {
            let helpMessage = "Discord Arena - Commandes utiles\n";
            helpMessage += "!start + <Classe> - Crée votre personnage avec la classe choisie\n";
            helpMessage += "!classes !c - Détail des classes existantes\n";
            helpMessage += "!personnage !p - Fiche de personnage\n";
            helpMessage += "!equip !e + <X> - Equipe l'objet à la position X de votre fiche de personnage\n";
            helpMessage += "!battle + <Nom> - Démarre un combat entre vous et la cible\n";
            helpMessage += "!victoryphrase !vp + <Phrase> - Enregistre une phrase prononcée en cas de victoire\n";
            helpMessage += "!defeatphrase !dp + <Phrase> - Enregistre la phrase prononcée en cas de défaite\n";
            helpMessage += "!skillphrase !sp + <Phrase> - Enregistre la phrase prononcée lors du lancement du skill actif\n";
            message.author.send(helpMessage);
            message.delete();
        }

        if (command === "classes" || command === "c")
        {
            let helpMessage = "Discord Arena - Classes de personnage\n";
            helpMessage += "[ Les combattants commencent à 10 HP - Les skills actifs ont 60% de chances de se lancer au début du combat ]  \n";
            helpMessage += "Barbare | FOR 8 | RES 5 | AGI 1 | LUK 2 | +2 dégats si équipé d'une Hache  \n";
            helpMessage += "Skill actif : Furie destructrice [FOR +3 - AGI et LUK à 0]\n";
            helpMessage += "Aventurier | FOR 4 | RES 4 | AGI 4 | LUK 4 | +2 dégats si équipé d'une Hache  \n";
            helpMessage += "Skill actif : Polyvalence [All stats +1]\n";
            helpMessage += "Sorcier | FOR 2 | RES 3 | AGI 3 | LUK 8 | +2 dégats si équipé d'une Magie  \n";
            helpMessage += "Skill actif : Bouclier d'Ether [RES et AGI +2]\n";
            helpMessage += "Templier | FOR 3 | RES 8 | AGI 1 | LUK 4 | +2 dégats si équipé d'une Lance  \n";
            helpMessage += "Skill actif : Foi inébranlable [Démarre le combat avec 15 HP]\n";
            helpMessage += "Barbare | FOR 8 | RES 5 | AGI 1 | LUK 2 | +2 dégats si équipé d'une Epée  \n";
            helpMessage += "Skill actif : Fumée ninja [AGI +5]\n";
            message.author.send(helpMessage);
            message.delete();
        }
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
            await col.insertOne(character);
            console.log("Character successfully created in characters");
            const charVerif = await col.findOne({discordName: character.discordName});
            console.log(charVerif);
            message.reply("Bienvenue à toi, " + charVerif.class + " " + charVerif.discordName);
        } catch (err) {
            console.log(err.stack);
        }
    })();
}

function getInfosPerso(message) {
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
                replyDM += "Phrase de victoire : " + charVerif.victoryPhrase + "\n";
                replyDM += "Phrase de défaite : " + charVerif.defeatPhrase + "\n";
                replyDM += "Phrase de lancement de skill : " + charVerif.skillPhrase + "\n";
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
            if (lastItem !== null)
                item.itemID = lastItem.itemID + 1;
            else
                item.itemID = 1;
            console.log("nouvel item");
            console.log(item);
            await col.insertOne(item);
            console.log("Item successfully created in DB items");
            getInfosPerso(message);
        } catch (err) {
            console.log(err.stack);
        }
    })();
}
function addItemToDBSilently(message, item) {
    (async function () {
        let dbClient;
        try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            const col = db.collection('items');
            //Récupération du dernier item en date pour incrémentation de l'ID
            let lastItem = await col.find().sort({itemID: -1}).limit(1).next();
            if (lastItem !== null)
                item.itemID = lastItem.itemID + 1;
            else
                item.itemID = 1;
            console.log("nouvel item");
            console.log(item);
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
            getInfosPerso(message);
        } catch (err) {
            console.log(err.stack);
        }
        
    })();
}
function optimize(message) {
    (async function () {
        let dbClient;
        try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            let listType=["Hache","Epee","Lance","Magie","Armure"]
            let col = db.collection('items');
            for (var power=0;power<6;power++)
            {
                for (var type=0;type<4;type++)
                {
                    var isChanged=0;
                    int compteur=0;
                    col.find({characterName: message.author.username, itemPower:power,itemType:listType[type]}).toArray(function(err, result) {
                    if (err) throw err;
                    if (result.length>1)
                    {
                        isChanged=1;
                        
                        for (var k=0;k<result.length;k++)
                        {
                            compteur+=result[k].number;
                        }
                   }
                    
                    
                        
                    
                });
                   if (isChanged===1)
                    {
                        col.deleteMany({characterName: message.author.username, itemPower:power,itemType:listType[type]}, function(err, obj) {
                        if (err) throw err;
                        //console.log(obj.result.n + " document(s) deleted");
                        });
                        
                        cole = db.collection('generic_equipments');
                        
                            let itemLoot = await cole.findOne({itemType: listType[type], itemPower: (power+1)});
                            const item1 = {
                                itemID: null,
                                characterName: message.author.username,
                                itemType: listType[type],
                                itemName: itemLoot.itemName,
                                itemPower: (power),
                                number:(compteur%5)
                            };
                        addItemToDBSilently(message, item1);
                        if (compteur/5>0) {
                            cole = db.collection('generic_equipments');
                            let itemLoot = await cole.findOne({itemType: listType[type], itemPower: (power+1)});
                            const item2 = {
                                itemID: null,
                                characterName: message.author.username,
                                itemType: listType[type],
                                itemName: itemLoot.itemName,
                                itemPower: (power+1),
                                number:(compteur/5)
                            };
                        
                        addItemToDBSilently(message, item2);
                    }
                    } 
                }
                
             
            }
             getInfosPerso(message);
           
            
            
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
            let colPhrases = db.collection('generic_catchphrases');
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
                    channel.send(`🤜💥🤛 Début du combat entre ${attackUser} et ${defendUser} !`);
                    //Récupération des statistiques des deux joueurs
                    let awp = 0;
                    let aap = 0;
                    let ahp = 10;
                    let astr = attacker.statSTR;
                    let ares = attacker.statRES;
                    let aluk = attacker.statLUK;
                    let aagi = attacker.statAGI;
                    let atp = "";
                    let dwp = 0;
                    let dap = 0;
                    let dhp = 10;
                    let dstr = defender.statSTR;
                    let dres = defender.statRES;
                    let dluk = defender.statLUK;
                    let dagi = defender.statAGI;
                    let dtp = "";

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
                        dtp = equipedItem.itemType;
                        if (dtp === "Hache" && defender.class === "Barbare") {
                            dwp += 2;
                        }
                        if (dtp === "Lance" && defender.class === "Templier") {
                            dwp += 2;
                        }
                        if (dtp === "Epée" && defender.class === "Voleur") {
                            dwp += 2;
                        }
                        if (dtp === "Magie" && defender.class === "Sorcier") {
                            dwp += 2;
                        }
                        if (dtp === "Magie") {
                            aap = 0;
                        }

                    }

                    if (attacker.weaponEquipID !== 0)
                    {
                        let equipedItem = await col.findOne({characterName: attacker.discordName, itemID: attacker.weaponEquipID});
                        awp = equipedItem.itemPower;
                        atp = equipedItem.itemType;
                        if (atp === "Hache" && attacker.class === "Barbare") {
                            awp += 2;
                        }
                        if (atp === "Lance" && attacker.class === "Templier") {
                            awp += 2;
                        }
                        if (atp === "Epée" && attacker.class === "Voleur") {
                            awp += 2;
                        }
                        if (atp === "Magie" && attacker.class === "Sorcier") {
                            awp += 2;
                        }
                        if (atp === "Magie") {
                            dap = 0;
                        }
                    }

                    //Application des effets
                    if (Math.random() < 0.6) //attacker - Compétences actives se déclenchent à 60% de chances
                    {
                        if (attacker.skillPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomSkillPhrase = await colPhrases.findOne({id:randomID,phraseType:"skill"});                            
                            channel.send(`🔥 ` + attacker.discordName + ": \"" + randomSkillPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`🔥 ` + attacker.discordName + ": \"" + attacker.skillPhrase + "\"");
                        switch (defender.class)
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
                    if (Math.random() < 0.6) //defender - Deux jets différents pour chaque joueur
                    {
                        if (defender.skillPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomSkillPhrase = await colPhrases.findOne({id:randomID,phraseType:"skill"});                            
                            channel.send(`🔥 ` +defender.discordName + ": \"" + randomSkillPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`🔥 ` +defender.discordName + ": \"" + defender.skillPhrase + "\"");
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

                    let adam = Math.max(1, astr - dres + awp - dap + aluk / 2); //Dégats de l'attaquant
                    let ddam = Math.max(1, dstr - ares + dwp - aap + dluk / 2); //Dégats du défenseur
                    let hitModificator = 2 * (aagi - dagi) + aluk - dluk;
                    let chancesToHitAtk = 75 + hitModificator;
                    let chancesToHitDef = 75 - hitModificator;

                    switch (atp + dtp)
                    {
                        case "HacheLance":
                        {
                            chancesToHitAtk *= 1.2;
                            chancesToHitDef *= 0.8;
                            break;
                        }
                        case "HacheEpee":
                        {
                            chancesToHitAtk *= 0.8;
                            chancesToHitDef *= 1.2;
                            break;
                        }
                        case "EpeeHache":
                        {
                            chancesToHitAtk *= 1.2;
                            chancesToHitDef *= 0.8;
                            break;
                        }
                        case "EpeeLance":
                        {
                            chancesToHitAtk *= 0.8;
                            chancesToHitDef *= 1.2;
                            break;
                        }
                        case "LanceEpee":
                        {
                            chancesToHitAtk *= 1.2;
                            chancesToHitDef *= 0.8;
                            break;
                        }
                        case "LanceHache":
                        {
                            chancesToHitAtk *= 0.8;
                            chancesToHitDef *= 1.2;
                            break;
                        }
                    }


                    //Début des tours de combat
                    let currentRound = 0;
                    while (ahp * dhp > 0)
                    {
                        currentRound++;
                        //tour de l'attaquant
                        let randAttacker = Math.random() * 100;
                        let dmgAtkFromRound = 0;
                        if (chancesToHitAtk > randAttacker)
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
                        let roundSummary = "⚔ Passe d'armes " + currentRound + "\n";
                        roundSummary += ("["+attacker.discordName+"]" + " Chances : " + Math.round(chancesToHitAtk) + " - Jet d'attaque : " + Math.round(randAttacker) + " - Dégats infligés : " + dmgAtkFromRound + "\n");
                        roundSummary += ("["+defender.discordName+"]" + " Chances : " + Math.round(chancesToHitDef) + " - Jet d'attaque : " + Math.round(randDefender) + " - Dégats infligés : " + dmgDefFromRound + "\n");
                        roundSummary += ("Points de vie restants - " + attacker.discordName + " : " + ahp + " / " + defender.discordName + " : " + dhp);
                        channel.send(roundSummary);
                    }

                    //Fin du combat
                    if (ahp === 0 && dhp === 0)
                    {
                        await channel.send(`${attackUser} ${defendUser} Double KO !`);
                        if (defender.defeatPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomDefeatPhrase = await colPhrases.findOne({id:randomID,phraseType:"defeat"});                            
                            channel.send(`☠` + defender.discordName + ": \"" + randomDefeatPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`☠` +defender.discordName + ": \"" + defender.defeatPhrase + "\"");
                        if (attacker.defeatPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomDefeatPhrase = await colPhrases.findOne({id:randomID,phraseType:"defeat"});                            
                            channel.send(`☠` +attacker.discordName + ": \"" + randomDefeatPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`☠` +attacker.discordName + ": \"" + attacker.defeatPhrase + "\"");
                    } else if (ahp === 0) // défaite de l'attaquant
                    {
                        await channel.send(`🔔` + `Victoire de ${defendUser} sur ${attackUser} !`);
                        if (defender.victoryPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomVictoryPhrase = await colPhrases.findOne({id:randomID,phraseType:"victory"});                            
                            channel.send(`✌` +defender.discordName + ": \"" + randomVictoryPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`✌` +defender.discordName + ": \"" + defender.victoryPhrase + "\"");
                        if (attacker.defeatPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomDefeatPhrase = await colPhrases.findOne({id:randomID,phraseType:"defeat"});                            
                            channel.send(`☠` +attacker.discordName + ": \"" + randomDefeatPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`☠` +attacker.discordName + ": \"" + attacker.defeatPhrase + "\"");
                    } else if (dhp === 0) //défaite du défenseur
                    {
                        await channel.send(`🔔` + `Victoire de ${attackUser} sur ${defendUser} !`);
                        if (attacker.victoryPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomVictoryPhrase = await colPhrases.findOne({id:randomID,phraseType:"victory"});                            
                            channel.send(`✌` +attacker.discordName + ": \"" + randomVictoryPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`✌` +attacker.discordName + ": \"" + attacker.victoryPhrase + "\"");
                        if (defender.defeatPhrase === null)
                        {
                            let randomID = Math.floor(Math.random()*5);
                            let randomDefeatPhrase = await colPhrases.findOne({id:randomID,phraseType:"defeat"});                            
                            channel.send(`☠` +defender.discordName + ": \"" + randomDefeatPhrase.phrase + "\"");
                        }
                        else
                            channel.send(`☠` +defender.discordName + ": \"" + defender.defeatPhrase + "\"");
                        
                        //Phase de gain d'item (seulement si attaquant vainqueur)
                        let type = "";
                        let power = 0;
                        let jetniv = Math.random();
                        let taux = 1 + Math.pow(2, -(3 - aluk / 4)) + Math.pow(3, -(3 - aluk / 4)) + Math.pow(4, -(3 - aluk / 4)) + Math.pow(5, -(3 - aluk / 4)) + Math.pow(6, -(3 - aluk / 4));
                        let p1 = 1 / (taux);
                        let p2 = p1 + 1 / (taux * Math.pow(2, -(3 - aluk / 4)));
                        let p3 = p2 + 1 / (taux * Math.pow(3, -(3 - aluk / 4)));
                        let p4 = p3 + 1 / (taux * Math.pow(4, -(3 - aluk / 4)));
                        let p5 = p4 + 1 / (taux * Math.pow(5, -(3 - aluk / 4)));
                        if (jetniv < p1)
                            power = 1;
                        else if (jetniv < p2)
                            power = 2;
                        else if (jetniv < p3)
                            power = 3;
                        else if (jetniv < p4)
                            power = 4;
                        else if (jetniv < p5)
                            power = 5;
                        else
                            power = 6;
                        //puissance 

                        let jettype = Math.random() * 6;
                        //1/3 d'avoir une armure
                        if (jettype < 1)
                            type = "Hache";
                        else if (jettype < 2)
                            type = "Epee";
                        else if (jettype < 3)
                            type = "Lance";
                        else if (jettype < 4)
                            type = "Magie";
                        else
                            type = "Armure";
                        col = db.collection('generic_equipments');
                        let itemLoot = await col.findOne({itemType: type, itemPower: power});
                        const item = {
                            itemID: null,
                            characterName: attacker.discordName,
                            itemType: type,
                            itemName: itemLoot.itemName,
                            itemPower: power,
                            number:1
                        };
                        addItemToDB(message, item);
                    }
                }
            }
        } catch (err) {
            console.log(err.stack);
        }
    })();
}

function setVictoryPhrase(message, phrase) {
    (async function () {
        let dbClient;
        try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            let col = db.collection('characters');
            await col.updateOne({discordName: message.author.username}, {$set: {victoryPhrase: phrase}});
            getInfosPerso(message);
        } catch (err) {
            console.log(err.stack);
        }
    })();
}

function setSkillPhrase(message, phrase) {
    (async function () {
        let dbClient;
        try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            let col = db.collection('characters');
            await col.updateOne({discordName: message.author.username}, {$set: {skillPhrase: phrase}});
            getInfosPerso(message);
        } catch (err) {
            console.log(err.stack);
        }
    })();
}

function setDefeatPhrase(message, phrase) {
    (async function () {
        let dbClient;
        try {
            dbClient = await MongoClient.connect(url);
            console.log("Connected to " + dbName);
            const db = dbClient.db(dbName);
            let col = db.collection('characters');
            await col.updateOne({discordName: message.author.username}, {$set: {defeatPhrase: phrase}});
            getInfosPerso(message);
        } catch (err) {
            console.log(err.stack);
        }
    })();
}

function getEmoji(emojiName) //Seulement si utilisation de custom emojis, sinon mettre le caractère unicode de l'emoji directement dans le message.reply()
{
    if(emojis!==null)
    {
        return emojis.find(emoji => emoji.name = ":"+emojiName+":");
    }
}

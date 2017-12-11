process.title = "discordarena";

var server = null;
var Discord = require('discord.js');
var client = new Discord.Client();

client.login('Mzg1MzcxNjI2MDg4MzAwNTQ0.DQAY2A.YK6aoMM4ph5G3MIP7pAqgF_kl3U'); //clef secrète obtenue via Discord Developers

client.on('ready', () => {
    console.log('I am ready!');
    server = client.guilds.get("256079257162350602");
    console.log('' + server.name);
    server.channels.find(chan => chan.id === "384709036924469250").send("Arena, ready to serve.");  //Changer les 2 ID en fonction de votre chan  

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
				className: args[0]
			};
			console.log(character);
			console.log(message.author.toString());
			(async function() {		
				message.reply("Bienvenue à toi, "+ character.className +" "+character.name);
			});
			//message.reply("Bienvenue à toi, "+ character.className +" "+character.name);
			
		}	
		//message.reply("coucou");
    }
});
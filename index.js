const fs = require('fs');
const http = require('http');
const botconfig = require("./botconfig.json");
const db = require('./Pokemons.json')
const imghash = require('imghash');
const Jimp = require('jimp');
const request = require('request').defaults({ encoding: null });

const Discord = require('discord.js');
const client = new Discord.Client();

const express = require('express');
const app = express();
var durum = false;
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.listen(botconfig.port);



client.commands = new Discord.Collection();
client.cmdhelp = new Discord.Collection();


client.loadCommands = () => {
  fs.readdir('./commands/', (err, files) => {
    if (err) console.error(err);

    let jsFiles = files.filter(f => f.split('.').pop() === 'js');

   

    jsFiles.forEach((f, i) => {
      delete require.cache[require.resolve(`./commands/${ f }`)];
      let props = require(`./commands/${ f }`);
      console.log("LOG Hazırlanıyor: " + f);
      client.commands.set(f, props);
      client.cmdhelp.set(props.help.name, props.help);
    });
  });
};

client.loadCommands();

client.on('ready', () => {
  console.log(`Pokécord Bot Hazır`);
  client.log(`Bot başlatıldı `, "HAZIR", "event");
  client.user.setActivity(`@${client.user.username} info`);
});

client.on('error', error => {
  console.log(`ERROR ${error}`);
  client.log(error, "Error", "error");
});

client.on('guildCreate', guild => {
  console.log(`GUILD JOIN ${guild.name} (${guild.id})`);
  client.log(`${guild.name} (${guild.id})`, "Guild Join", "joinleave");
});


client.on('guildDelete', guild => {
  console.log(`GUILD LEAVE ${guild.name} (${guild.id})`);
  client.log(`${guild.name} (${guild.id})`, "Guild Leave", "joinleave");
});

var ID = function () {
  return '_' + Math.random().toString(36).substr(2, 9);
};
var interval;

function dongu(message,z,x){
   
  var i =0;
  var j = 0;
 if(durum===true){
  interval = setInterval (function () { 
       
    if (j<z) {
    message.channel.send("p!select  "+Math.round(Math.random()*botconfig.pokemonCount)).catch(console.error);
     while(i<x){ 
         message.channel.send(i+" Kere Pokemon Spamı  \n "+ ID()).catch(console.error);
         i++;
     }
     j++; 
     i=0;
    
    }
 }, 1 * 2000);
 }
}

client.on('message', function(message) {
  let prefix ="!";
  if (message.content === prefix+"pokespam") { 
      durum = true;
      dongu(message,10,10);
  }
});

client.on('message', function(message) {
  let prefix ="!";
  if (message.content === prefix+"reset") { 
    durum = false;
      clearInterval(interval);
      client.channels.get(botconfig.channel).send("Stopped");
      resetBot(botconfig.channel);
    
  }
});

function resetBot(channel) {
  
  client.channels.get(botconfig.channel).send('Durduruluyor...')
  .then(msg => client.destroy())
  .then(() => client.login(botconfig.token));
}

client.on('message', message => {
  try {
  	let embed = new Discord.RichEmbed()
  		.setColor(0xFF4500);
    
    if (message.guild && !message.channel.memberPermissions(client.user).has('SEND_MESSAGES')) return;
    
    if (message.guild && !message.channel.memberPermissions(client.user).has('EMBED_LINKS')) {
      return message.channel.send("`Embed Links 'iznine ihtiyacım var. Lütfen bu sunucudaki bir yöneticiye başvurun.");
    }

    if (message.author.id == '365975655608745985') {
      message.embeds.forEach((e) => {
        if (e.description !== undefined ) {
          if (e.image) {
            let url = e.image.url;
         

            request(url, async function(err, res, body) {
              if (err !== null) return;
            
              imghash
                .hash(body)
                .then(hash => {
                  let result = db[hash];
                  client.log("Yakala");
                  client.channels.get(botconfig.channel).send("p!catch "+result);
                  if (result === undefined) {
                    embed
                      .setTitle("Pokemon Bulunamadı")
                      .setDescription("Bu Pokemon'u veritabanına eklemek için lütfen CHamburr#2591 ile iletişime geçin.");
                    return message.channel.send(embed);
                  }
                
                  new Jimp(1024, 256, "#303030", (err, img) => {
                    Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).then(font => {
                      Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(font2 => {
                        img.print(font, 0, 50, {
                          text: result,
                          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
                        }, img.bitmap.width, img.bitmap.height);
                        img.print(font2, 0, img.bitmap.height - 100, {
                          text: "Bot ile ilgili yardim almak ve iletisime gecmek icin https://discord.gg/WwYD2AK",
                          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
                        }, img.bitmap.width, img.bitmap.height);
                        img.getBufferAsync("image/png")
                          .then(res => {
                              message.channel.send({files:[{attachment: res, name: "file.png"}]});
                          });
                      });
                    });
                  });
                
                  console.log("[" + message.guild.name + "/#" + message.channel.name + "] " + result);
                })
            });
          }
        }
      });
    }

    if (message.author.bot) return;

    let prefix = false;
	  let args = message.content;
  	let command = "";
    
    if (message.content.startsWith("<@" + client.user.id + ">")) {
      prefix = "<@" + client.user.id + ">";
    }
    else if (message.content.startsWith("<@!" + client.user.id + ">")) {
      prefix = "<@!" + client.user.id + ">";
    } else {
      return;
    }
    
    args = message.content.slice(prefix.length).trim().split(/ +/g);
    command = args.shift().toLowerCase();

    let cmd = client.commands.get(command + ".js");
    
    if (cmd) {
      cmd.run(client, message, args);
      console.log(`[${message.guild.name}/#${message.channel.name}] ${message.author.tag} (${message.author.id}): ${cmd.help.name}`);
    }
  } catch (error3) {
    console.log("ERROR at Message: " + error3);
    client.log(error3, "Error at Message", "error");
  }
});

client.clean = async (text) => {
  if (text && text.constructor.name == "Promise")
    text = await text;
  
  if (typeof evaled !== "string")
    text = require("util").inspect(text, {depth: 1});

  text = text
    .replace(/`/g, "`" + String.fromCharCode(8203))
    .replace(/@/g, "@" + String.fromCharCode(8203))
    .replace(process.env.TOKEN, botconfig.token);

  return text;
};

client.log = async (content, title, type) => {
  let embed = new Discord.RichEmbed()
    .setTitle(title)
    .setDescription(content.toString().substr(0, 2048))
    .setColor(0xFF4500)
    .setTimestamp();
  
  if (type === "event") {
    client.channels.get(botconfig.channel).send(embed);
  }
  else if (type === "error") {
    client.channels.get(botconfig.channel).send(embed);
  }
  else if (type === "joinleave") {
    client.channels.get(botconfig.channel).send(embed);
  }
};

client.login(botconfig.token);

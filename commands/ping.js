const Discord = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: [''],
    description: 'Ping!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    
    execute(message, args){
        message.reply(`Websocket: ${Math.round(message.client.ping)} ms\nResponse time: ${(new Date().getTime()) - message.sentTime} ms`);
    },
}
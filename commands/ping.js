const Discord = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: [''],
    description: 'Ping!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    
    execute(message, args){
        message.reply(`${Math.round(message.client.ping)} ms`);
    },
}
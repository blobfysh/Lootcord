const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'gamble',
    aliases: [''],
    description: 'Gamble your money away!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        message.reply('Gamble commands were turned into standalone commands. Now you can just do `t-coinflip 100` etc.');
    },
}
const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'money',
    aliases: ['cash', 'balance'],
    description: 'Displays your current balance.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            message.reply(lang.money[0].replace('{0}', methods.formatMoney(row[0].money)));
        });
    },
}
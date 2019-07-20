const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods');

module.exports = {
    name: 'health',
    aliases: ['hp'],
    description: 'Displays current health.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];

        message.reply(lang.health[0].replace('{0}', methods.getHealthIcon(row.health, row.maxHealth) + '`' + row.health + '/' + row.maxHealth + '`'));
    },
}
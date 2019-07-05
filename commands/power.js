const Discord = require('discord.js');
const { query } = require('../mysql.js');

module.exports = {
    name: 'power',
    aliases: [''],
    description: 'View your current power.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];
        
        message.reply(`You currently have **${row.power}/${row.max_power}** power.`);
    },
}
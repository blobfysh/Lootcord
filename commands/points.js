const Discord = require('discord.js');
const { query } = require('../mysql.js');

module.exports = {
    name: 'points',
    aliases: ['xp'],
    description: 'Shows total experience earned.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            message.reply(`You currently have ${row[0].points} points!`);
        });
    },
}
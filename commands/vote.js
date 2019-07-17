const Discord = require('discord.js');
const { query } = require('../mysql.js');

module.exports = {
    name: 'vote',
    aliases: [''],
    description: 'Vote for the bot to collect a reward!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`))[0];

        if(message.client.sets.voteCooldown.has(message.author.id)){
            message.reply(lang.vote[0].replace('{0}', (((43200 * 1000 - ((new Date()).getTime() - row.voteTime)) / 60000).toFixed(1)/60).toFixed(1)));
        }
        else{
            message.reply(lang.vote[1]);
        }
    },
}
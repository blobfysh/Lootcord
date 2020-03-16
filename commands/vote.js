const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods');

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
        const voteCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'vote'
        });

        if(voteCD){
            message.reply(lang.vote[0].replace('{0}', voteCD));
        }
        else{
            message.reply(lang.vote[1]);
        }
    },
}
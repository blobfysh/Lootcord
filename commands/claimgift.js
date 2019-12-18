const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList');

module.exports = {
    name: 'claimgift',
    aliases: [''],
    description: 'Christmas event command!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores 
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId = ${message.author.id}`))[0];

        if(message.client.sets.eventCooldown.has(message.author.id)){
            return message.reply(`You can claim your next gift in \`${(((43200 * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1)} hours\`!`);
        }

        const hasenough = await methods.hasenoughspace(message.author.id, 1);
        if(!hasenough) return message.reply(lang.errors[2]);

        methods.additem(message.author.id, 'token', 1);
        methods.additem(message.author.id, 'present', 1);
        message.reply('**MERRY CHRISTMAS** You received the following items:\n<:plus_icon:610502532003004435>1x ' + itemdata['token'].icon + '`token`\n<:plus_icon:610502532003004435>1x ' + itemdata['present'].icon + '`present`!\nUnwrap the `present` to see what Christmas item you get\n\nMake sure to use this command each day and collect more tokens to buy games from the `shop`!');

        query(`UPDATE cooldowns SET prizeTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
        message.client.shard.broadcastEval(`this.sets.eventCooldown.add('${message.author.id}')`);
        setTimeout(() => {
            message.client.shard.broadcastEval(`this.sets.eventCooldown.delete('${message.author.id}')`);
            query(`UPDATE cooldowns SET prizeTime = ${0} WHERE userId = ${message.author.id}`);
        }, 43200 * 1000);
    },
} 
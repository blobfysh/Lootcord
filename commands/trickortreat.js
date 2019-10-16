const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList');

module.exports = {
    name: 'trickortreat',
    aliases: ['halloween', 'spooky'],
    description: 'Halloween event command!',
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
            return message.reply(`You can claim your next trick-or-treat in \`${(((43200 * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1)} hours\`!`);
        }

        const hasenough = await methods.hasenoughspace(message.author.id, 1);
        if(!hasenough) return message.reply(lang.errors[2]);
        
        if(Math.random() <= 0.25){
            let randAmt = Math.floor((Math.random() * (4000 - 500 + 1)) + 500);
            methods.addmoney(message.author.id, randAmt);
            message.reply('**Trick or treat!** You received the following items:\n1x ' + itemdata['token'].icon + '`token` **and** ' + methods.formatMoney(randAmt) + '\n\nMake sure to use this command each day and collect more tokens to buy games from the `shop`!');
        }
        else{
            methods.additem(message.author.id, 'token', 1);
            methods.additem(message.author.id, 'candy_pail', 1);
            message.reply('**Trick or treat!** You received the following items:\n1x ' + itemdata['token'].icon + '`token` **and a** ' + itemdata['candy_pail'].icon + '`candy_pail`!\nCheck inside the `candy_pail` to see what Halloween item you get\n\nMake sure to use this command each day and collect more tokens to buy games from the `shop`!');
        }
        
        
        query(`UPDATE cooldowns SET prizeTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
        message.client.shard.broadcastEval(`this.sets.eventCooldown.add('${message.author.id}')`);
        setTimeout(() => {
            message.client.shard.broadcastEval(`this.sets.eventCooldown.delete('${message.author.id}')`);
            query(`UPDATE cooldowns SET prizeTime = ${0} WHERE userId = ${message.author.id}`);
        }, 43200 * 1000);
    },
}
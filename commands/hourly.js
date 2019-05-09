const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'hourly',
    aliases: ['hour'],
    description: 'Receive a free item_box every hour!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores 
        INNER JOIN items 
        ON scores.userId = items.userId
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId = ${message.author.id}`).then(oldRow => {
            const row = oldRow[0];

            if(message.client.sets.hourlyCooldown.has(message.author.id)){
                return message.reply(lang.general[9].replace('{0}', ((3600 * 1000 - ((new Date()).getTime() - row.hourlyTime)) / 60000).toFixed(1)));
            }

            methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                if(!hasenough) return message.reply(lang.errors[2]);

                let luck = row.luck >= 40 ? 10 : Math.floor(row.luck/4);
                let chance = Math.floor(Math.random() * 100) + luck;
                if(chance >= 100){
                    message.reply("🍀Here's a free `ultra_box`!");
                    query(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${message.author.id}`);
                }
                else{
                    message.reply("Here's a free `item_box`!");
                    query(`UPDATE items SET item_box = ${row.item_box + 1} WHERE userId = ${message.author.id}`);
                }
                
                query(`UPDATE cooldowns SET hourlyTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                message.client.shard.broadcastEval(`this.sets.hourlyCooldown.add('${message.author.id}')`);
            });
        });
        setTimeout(() => {
            message.client.shard.broadcastEval(`this.sets.hourlyCooldown.delete('${message.author.id}')`);
            query(`UPDATE cooldowns SET hourlyTime = ${0} WHERE userId = ${message.author.id}`);
        }, 3600 * 1000);
    },
}
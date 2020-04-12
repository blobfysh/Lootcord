const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList');
const config = require('../json/_config');

module.exports = {
    name: 'hourly',
    aliases: ['hour'],
    description: 'Receive a free item_box every hour!',
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

        const hourlyCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'hourly'
        });

        if(hourlyCD){
            return message.reply(`You need to wait \`${hourlyCD}\` before using this command again.`);
        }
        await methods.addCD(message.client, {
            userId: message.author.id,
            type: 'hourly',
            time: config.cooldowns.hourly * 1000
        });

        const hasenough = await methods.hasenoughspace(message.author.id, 1);
        if(!hasenough) return message.reply(lang.errors[2]);

        let luck = row.luck >= 40 ? 10 : Math.floor(row.luck/4);
        let chance = Math.floor(Math.random() * 100) + luck;
        
        if(chance >= 100){
            message.reply("🍀Here's a free " + itemdata['ultra_box'].icon + "`ultra_box`!");
            methods.additem(message.author.id, 'ultra_box', 1);
        }
        else{
            message.reply("Here's a free " + itemdata['item_box'].icon + "`item_box`!");
            methods.additem(message.author.id, 'item_box', 1);
        }
    },
}
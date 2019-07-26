const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'claimdrop',
    aliases: [''],
    description: 'Claim a `care_package` drop.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const guildInfo = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);
        const userRow = (await query(`SELECT * FROM scores 
        INNER JOIN items 
        ON scores.userId = items.userId
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId = ${message.author.id}`))[0];

        const hasEnough = await methods.hasenoughspace(message.author.id, 1);
    

        if(message.channel.id !== guildInfo[0].dropItemChan){
            return message.reply(lang.claimdrop[0]);
        }
        
        if(guildInfo[0].dropItem == ''){
            return message.reply(lang.claimdrop[1]);
        }
        else if(message.client.sets.airdropCooldown.has(message.author.id)){
            return message.reply(lang.claimdrop[2].replace('{0}', (((21600 * 1000 - ((new Date()).getTime() - userRow.airdropTime)) / 60000).toFixed(1)/60).toFixed(1)));
        }
        else if(!hasEnough) return message.reply(lang.errors[2]);
        
        else{
            query(`UPDATE items SET ${guildInfo[0].dropItem} = ${userRow[guildInfo[0].dropItem] + 1} WHERE userId = ${message.author.id}`);
            query(`UPDATE guildInfo SET dropItem = '' WHERE guildId = ${message.guild.id}`);
            query(`UPDATE guildInfo SET dropItemChan = 0 WHERE guildId = ${message.guild.id}`);

            query(`UPDATE cooldowns SET airdropTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            message.client.shard.broadcastEval(`this.sets.airdropCooldown.add('${message.author.id}')`);
            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.airdropCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET airdropTime = ${0} WHERE userId = ${message.author.id}`);
            }, 21600 * 1000);

            message.reply(`You got the \`${guildInfo[0].dropItem}\`!`);
        }
    },
}
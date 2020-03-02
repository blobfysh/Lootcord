const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'coinflip',
    aliases: ['cf'],
    description: 'Flip a coin for a chance to win!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores 
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId ="${message.author.id}"`))[0];
        var gambleAmount = args[0];

        if(message.client.sets.cfCooldown.has(message.author.id)){
            message.reply(lang.general[10].replace('{0}', ((60 * 1000 - ((new Date()).getTime() - row.coinflipTime)) / 1000).toFixed(0)));
            return;
        }
        else if(gambleAmount !== undefined && gambleAmount >= 100){
            gambleAmount = Math.floor(gambleAmount);

            if(gambleAmount > row.money){
                return message.reply(lang.buy[4]);
            }
            else if(gambleAmount > 1000000){
                return message.reply(`You cannot bet more than ${methods.formatMoney(1000000)}`);
            }
            
            if(Math.random() < 0.5){
                methods.addmoney(message.author.id, gambleAmount);
                message.reply(lang.gamble.coinflip[0].replace('{0}', methods.formatMoney(gambleAmount * 2)));
            }
            else{
                methods.removemoney(message.author.id, gambleAmount);
                message.reply(lang.gamble.coinflip[1].replace('{0}', methods.formatMoney(gambleAmount)));
            }

            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.cfCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET coinflipTime = ${0} WHERE userId = ${message.author.id}`);
            }, 60 * 1000);
            
            message.client.shard.broadcastEval(`this.sets.cfCooldown.add('${message.author.id}')`);
            query(`UPDATE cooldowns SET coinflipTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
        }
        else{
            methods.commandhelp(message, "coinflip", prefix);
        }
    },
}
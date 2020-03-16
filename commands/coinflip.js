const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const config = require('../json/_config');

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
        const row = (await query(`SELECT * FROM scores WHERE scores.userId ="${message.author.id}"`))[0];
        const coinflipCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'coinflip'
        });
        var gambleAmount = args[0];

        if(coinflipCD){
            return message.reply(`You need to wait  \`${coinflipCD}\`  before using this command again`);
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
            
            await methods.addCD(message.client, {
                userId: message.author.id,
                type: 'coinflip',
                time: config.cooldowns.coinflip * 1000
            })
        }
        else{
            methods.commandhelp(message, "coinflip", prefix);
        }
    },
}
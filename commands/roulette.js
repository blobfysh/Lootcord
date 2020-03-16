const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const config = require('../json/_config');

module.exports = {
    name: 'roulette',
    aliases: [''],
    description: 'Put some money in the slot machine!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE scores.userId ="${message.author.id}"`))[0];
        const rouletteCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'roulette'
        });
        var gambleAmount = args[0];

        if(rouletteCD){
            return message.reply(`You need to wait  \`${rouletteCD}\`  before using this command again`);
        }
        else if(row.health < 25){
            return message.reply(lang.gamble.general[1].replace('{0}', row.health).replace('{1}', row.maxHealth));
        }
        else if(gambleAmount !== undefined && gambleAmount >= 100){
            gambleAmount = Math.floor(gambleAmount);
            
            if(gambleAmount > row.money){
                return message.reply(lang.buy[4]);
            }
            else if(gambleAmount > 1000000){
                return message.reply(`You cannot bet more than ${methods.formatMoney(1000000)}`);
            }
            
            methods.removemoney(message.author.id, gambleAmount);
            let multiplier = 1.2;
            let winnings = Math.floor(gambleAmount * multiplier);
            let chance = Math.floor(Math.random() * 100); //return 1-100

            if(chance <= 20){
                let healthDeduct = 50;
                if(row.health <= 50){
                    healthDeduct = row.health - 1;
                    query(`UPDATE scores SET health = ${1} WHERE userId = ${message.author.id}`);
                }
                else{
                    query(`UPDATE scores SET health = ${row.health - 50} WHERE userId = ${message.author.id}`);
                }
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(lang.gamble.roulette[0].replace('{0}', message.author).replace('{1}', healthDeduct).replace('{2}', (row.health - healthDeduct)).replace('{3}', methods.formatMoney(gambleAmount)));
                    }, 1500);
                });
            }
            else{
                methods.addmoney(message.author.id, winnings);
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(lang.gamble.roulette[1].replace('{0}', message.author).replace('{1}', methods.formatMoney(winnings)));
                    }, 1500);
                });
            }

            await methods.addCD(message.client, {
                userId: message.author.id,
                type: 'roulette',
                time: config.cooldowns.roulette * 1000
            });
        }
        else{
            methods.commandhelp(message, "roulette", prefix);
        }
    },
}
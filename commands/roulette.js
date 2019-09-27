const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

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
        const row = (await query(`SELECT * FROM scores 
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId ="${message.author.id}"`))[0];
        var gambleAmount = args[0];

        if(message.client.sets.rouletteCooldown.has(message.author.id)){
            message.reply(lang.general[10].replace('{0}', ((60 * 1000 - ((new Date()).getTime() - row.rouletteTime)) / 1000).toFixed(0)));
            return;
        }
        else if(row.health < 25){
            return message.reply(lang.gamble.general[1].replace('{0}', row.health).replace('{1}', row.maxHealth));
        }
        else if(gambleAmount !== undefined && gambleAmount >= 100){
            gambleAmount = Math.floor(gambleAmount);
            
            if(gambleAmount > row.money){
                return message.reply(lang.buy[4]);
            }
            
            methods.removemoney(message.author.id, gambleAmount);
            let multiplier = 1.2;
            let winnings = Math.floor(gambleAmount * multiplier);
            let luck = row.luck >= 20 ? 10 : Math.floor(row.luck/2);
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100

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
                        msg.edit(lang.gamble.roulette[0].replace('{0}', message.author).replace('{1}', healthDeduct).replace('{2}', (row.health - healthDeduct)).replace('{3}', gambleAmount));
                    }, 1500);
                });
            }
            else{
                methods.addmoney(message.author.id, winnings);
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(lang.gamble.roulette[1].replace('{0}', message.author).replace('{1}', winnings));
                    }, 1500);
                });
            }

            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.rouletteCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET rouletteTime = ${0} WHERE userId = ${message.author.id}`);
            }, 60 * 1000);
            
            message.client.shard.broadcastEval(`this.sets.rouletteCooldown.add('${message.author.id}')`);
            query(`UPDATE cooldowns SET rouletteTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
        }
        else{
            methods.commandhelp(message, "roulette", prefix);
        }
    },
}
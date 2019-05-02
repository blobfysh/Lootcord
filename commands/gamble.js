const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'gamble',
    aliases: [''],
    description: 'Gamble your money away!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM scores 
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId ="${message.author.id}"`).then(oldRow => {
            var row = oldRow[0];
            var gambleTypes = ["slots","slot","roulette","coinflip","cf"];
            var gambleType = args[0];
            var gambleAmount = args[1];

            if(message.client.sets.gambleCooldown.has(message.author.id)){
                message.reply(lang.general[10].replace('{0}', ((60 * 1000 - ((new Date()).getTime() - row.gambleTime)) / 1000).toFixed(0)));
                return;
            }

            else if(!gambleTypes.includes(gambleType)){
                return message.reply(lang.gamble.general[0])
            }

            else if(gambleAmount !== undefined && gambleAmount >= 100){
                gambleAmount = Math.floor(gambleAmount);
                
                if(gambleAmount > row.money){
                    return message.reply(lang.buy[4]);
                }
                
                else if(gambleType == "slots" || gambleType == "slot"){
                    query(`UPDATE scores SET money = ${row.money - gambleAmount} WHERE userId = ${message.author.id}`);
                    methods.slots(message, message.author.id, gambleAmount, lang);
                }
                
                else if(gambleType == "roulette"){
                    if(row.health < 25){
                        return message.reply(lang.gamble.general[1].replace('{0}', row.health).replace('{1}', row.maxHealth));
                    }
                    query(`UPDATE scores SET money = ${row.money - gambleAmount} WHERE userId = ${message.author.id}`);
                    methods.roulette(message, message.author.id, gambleAmount, lang);
                }
                
                else if(gambleType == "coinflip" || gambleType == "cf"){
                    methods.coinflip(message, message.author.id, gambleAmount, lang);
                }


                setTimeout(() => {
                    message.client.shard.broadcastEval(`this.sets.gambleCooldown.delete('${message.author.id}')`);
                    query(`UPDATE cooldowns SET gambleTime = ${0} WHERE userId = ${message.author.id}`);
                }, 60 * 1000);
                
                message.client.shard.broadcastEval(`this.sets.gambleCooldown.add('${message.author.id}')`);
                query(`UPDATE cooldowns SET gambleTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            }

            else{
                //give user info on command
                if(gambleType == "slots" || gambleType == "slot"){
                    methods.commandhelp(message, "slots", prefix);
                }
                else if(gambleType == "roulette"){
                    methods.commandhelp(message, "roulette", prefix);
                }
                else if(gambleType == "coinflip" || gambleType == "cf"){
                    methods.commandhelp(message, "coinflip", prefix);
                }
            }
        });
    },
}
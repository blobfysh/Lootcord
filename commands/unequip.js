const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const config    = require('../json/_config.json');
const itemdata  = require('../json/completeItemList.json');

module.exports = {
    name: 'unequip',
    aliases: [''],
    description: 'Unequip an item.',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM items i
        INNER JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`).then(oldRow => {
            const row     = oldRow[0];
            let equipitem = methods.getCorrectedItemInfo(args[0]);

            if(row.backpack == equipitem || equipitem == "backpack"){
                if(row.backpack !== "none"){
                    query(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`);
                    query(`UPDATE scores SET inv_slots = ${0} WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${row.backpack} = ${row[row.backpack] + 1} WHERE userId = ${message.author.id}`);
                    message.reply(lang.unequip[0].replace('{0}', row.backpack).replace('{1}', config.base_inv_slots));
                }
                else{
                    message.reply(lang.unequip[1]);
                }
            }

            else if(row.armor == equipitem || equipitem == "armor"){
                if(row.armor !== "none"){
                    query(`UPDATE scores SET armor = 'none' WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${row.armor} = ${row[row.armor] + 1} WHERE userId = ${message.author.id}`);
                    message.reply(lang.unequip[2].replace('{0}', row.armor));
                }
                else{
                    message.reply(lang.unequip[3]);
                }
            }

            else if(row.banner == equipitem || equipitem == "banner"){
                if(row.banner !== "none"){
                    query(`UPDATE scores SET banner = 'none' WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${row.banner} = ${row[row.banner] + 1} WHERE userId = ${message.author.id}`);
                    message.reply(lang.unequip[2].replace('{0}', row.banner));
                }
                else{
                    message.reply(lang.unequip[3]);
                }
            }

            else if(message.client.sets.activeShield.has(message.author.id) && itemdata[equipitem].isShield){
                if(message.client.sets.weapCooldown.has(message.author.id)){
                    return methods.getAttackCooldown(message.author.id).then(timeLeft => {
                        return message.reply(lang.unequip[6].replace('{0}', timeLeft));
                    });
                }
                message.client.shard.broadcastEval(`this.sets.activeShield.delete('${message.author.id}')`);

                query(`UPDATE cooldowns SET mittenShieldTime = 0 WHERE userId = '${message.author.id}'`);
                query(`UPDATE cooldowns SET ironShieldTime = 0 WHERE userId = '${message.author.id}'`);
                query(`UPDATE cooldowns SET goldShieldTime = 0 WHERE userId = '${message.author.id}'`);

                message.client.shard.broadcastEval(`
                    this.shieldTimes.forEach(arrObj => {
        
                        if(arrObj.userId == ${message.author.id}){
                            //stop the timer
                            clearTimeout(arrObj.timer);
                
                            //remove from airdropTimes array
                            this.shieldTimes.splice(this.shieldTimes.indexOf(arrObj), 1);
                
                            console.log('canceled a timeout');
                        }
                
                    });
                `);

                methods.addToWeapCooldown(message, message.author.id, 'ak47'); // Prevents user from attacking for 60 minutes.

                message.reply(lang.unequip[5].replace('{0}', 'shield'));
            }

            else{
                message.reply(lang.unequip[4]);
            }
        });
    },
}
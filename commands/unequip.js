const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const config    = require('../json/_config.json');
const itemdata  = require('../json/completeItemList.json');
const icons     = require('../json/icons');
const general   = require('../methods/general');

module.exports = {
    name: 'unequip',
    aliases: [''],
    description: 'Unequip an item.',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const userRow = (await query(`SELECT * FROM scores WHERE userId = "${message.author.id}"`))[0];
        let equipitem = general.parseArgsWithSpaces(args[0], args[1], args[2]);

        if(userRow.backpack == equipitem || equipitem == "backpack"){
            if(userRow.backpack !== "none"){
                query(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`);
                query(`UPDATE scores SET inv_slots = ${0} WHERE userId = ${message.author.id}`);
                methods.additem(message.author.id, userRow.backpack, 1);

                message.reply(lang.unequip[0].replace('{-1}', itemdata[userRow.backpack].icon).replace('{0}', userRow.backpack).replace('{1}', config.base_inv_slots));
            }
            else{
                message.reply(lang.unequip[1]);
            }
        }

        else if(userRow.armor == equipitem || equipitem == "armor"){
            if(userRow.armor !== "none"){
                query(`UPDATE scores SET armor = 'none' WHERE userId = ${message.author.id}`);
                methods.additem(message.author.id, userRow.armor, 1);

                message.reply(lang.unequip[2].replace('{-1}', itemdata[userRow.armor].icon).replace('{0}', userRow.armor));
            }
            else{
                message.reply(lang.unequip[3]);
            }
        }

        else if(userRow.banner == equipitem || equipitem == "banner"){
            if(userRow.banner !== "none"){
                query(`UPDATE scores SET banner = 'none' WHERE userId = ${message.author.id}`);
                methods.additem(message.author.id, userRow.banner, 1);

                message.reply(lang.unequip[2].replace('{-1}', itemdata[userRow.banner].icon).replace('{0}', userRow.banner));
            }
            else{
                message.reply(lang.unequip[3]);
            }
        }

        else if(message.client.sets.activeShield.has(message.author.id) && itemdata[equipitem].isShield){
            if(message.client.sets.weapCooldown.has(message.author.id)){
                return message.reply(lang.unequip[6].replace('{0}', await methods.getAttackCooldown(message.author.id) ));
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

            message.reply(lang.unequip[5].replace('{-1}', icons.items.shield).replace('{0}', 'shield'));
        }

        else{
            message.reply(lang.unequip[4]);
        }
    },
}
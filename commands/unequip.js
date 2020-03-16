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
        const shieldCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'shield'
        });
        let equipitem = general.parseArgsWithSpaces(args[0], args[1], args[2]);

        if(userRow.backpack == equipitem || equipitem == "backpack"){
            if(userRow.backpack !== "none"){
                query(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`);
                query(`UPDATE scores SET inv_slots = inv_slots - ${itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id}`);
                methods.additem(message.author.id, userRow.backpack, 1);

                message.reply(lang.unequip[0].replace('{-1}', itemdata[userRow.backpack].icon).replace('{0}', userRow.backpack).replace('{1}', config.base_inv_slots + (userRow.inv_slots - itemdata[userRow.backpack].inv_slots)));
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

        else if(userRow.ammo == equipitem || equipitem == "ammo"){
            if(userRow.ammo !== "none"){
                query(`UPDATE scores SET ammo = 'none' WHERE userId = ${message.author.id}`);

                message.reply(lang.unequip[2].replace('{-1}', itemdata[userRow.ammo].icon).replace('{0}', userRow.ammo));
            }
            else{
                message.reply("You haven't set a preferred ammo type! Equip a preferred ammo with `equip <item>`");
            }
        }

        else if(shieldCD && (itemdata[equipitem].isShield) || equipitem == 'shield'){
            const attackCD = methods.getCD(message.client, {
                userId: message.author.id,
                type: 'attack'
            });
            
            if(attackCD){
                return message.reply(lang.unequip[6].replace('{0}', '`' + attackCD + '`'));
            }

            methods.clearCD(message.client, message.author.id, 'shield');

            await methods.addCD(message.client, {
                userId: message.author.id,
                type: 'attack',
                time: 3600 * 1000
            });

            message.reply(lang.unequip[5].replace('{-1}', icons.items.shield).replace('{0}', 'shield'));
        }

        else{
            message.reply(lang.unequip[4]);
        }
    },
}
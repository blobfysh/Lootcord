const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const config = require('../json/_config.json');
const general = require('../methods/general');

module.exports = {
    name: 'equip',
    aliases: ['wear'],
    description: 'Equip an item.',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const userRow = (await query(`SELECT * FROM scores WHERE userId="${message.author.id}"`))[0];
        let equipitem = general.parseArgsWithSpaces(args[0], args[1], args[2]);

        if(equipitem !== undefined && itemdata[equipitem] !== undefined && itemdata[equipitem].equippable == "true"){
            const haspack = await methods.hasitems(message.author.id, equipitem, 1);

            if(haspack){
                if(userRow.backpack == "none" && itemdata[equipitem].type == "backpack"){
                    query(`UPDATE scores SET backpack = '${equipitem}' WHERE userId = ${message.author.id}`);
                    query(`UPDATE scores SET inv_slots = inv_slots + ${itemdata[equipitem].inv_slots} WHERE userId = ${message.author.id}`);
                    methods.removeitem(message.author.id, equipitem, 1);

                    message.reply(lang.equip[0].replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem).replace('{1}', itemdata[equipitem].inv_slots).replace('{2}', itemdata[equipitem].inv_slots + config.base_inv_slots + userRow.inv_slots));
                }
                else if(userRow.armor == "none" && itemdata[equipitem].type == "armor"){
                    query(`UPDATE scores SET armor = '${equipitem}' WHERE userId = ${message.author.id}`);
                    //add armor defense % to sql table somewhere?
                    methods.removeitem(message.author.id, equipitem, 1);

                    message.reply(lang.equip[1].replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem));
                }
                else if(userRow.banner == 'none' && itemdata[equipitem].isBanner){
                    query(`UPDATE scores SET banner = '${equipitem}' WHERE userId = ${message.author.id}`);
                    methods.removeitem(message.author.id, equipitem, 1);

                    message.reply(lang.equip[1].replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem));
                }
                else if(itemdata[equipitem].isAmmo.length){
                    query(`UPDATE scores SET ammo = '${equipitem}' WHERE userId = ${message.author.id}`);

                    message.reply("Successfully set {-1}`{0}` as your preferred ammo type. (Will prioritize over other ammo types.)".replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem));
                }
                else{
                    message.reply(lang.equip[2])
                }
            }
            else{
                message.reply(lang.equip[3]);
            }
        }
        else{
            message.reply(lang.equip[4]);
        }
    },
}
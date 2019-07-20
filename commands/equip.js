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
        const row = (await query(`SELECT * FROM items i
        INNER JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`))[0];
        let equipitem = general.parseArgsWithSpaces(args[0], args[1], args[2]);

        if(equipitem !== undefined && itemdata[equipitem] !== undefined && itemdata[equipitem].equippable == "true"){
            const haspack = await methods.hasitems(message.author.id, equipitem, 1);

            if(haspack){
                if(row.backpack == "none" && itemdata[equipitem].type == "backpack"){
                    query(`UPDATE scores SET backpack = '${equipitem}' WHERE userId = ${message.author.id}`);
                    query(`UPDATE scores SET inv_slots = ${itemdata[equipitem].inv_slots} WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${equipitem} = ${row[equipitem] - 1} WHERE userId = ${message.author.id}`);

                    message.reply(lang.equip[0].replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem).replace('{1}', itemdata[equipitem].inv_slots).replace('{2}', itemdata[equipitem].inv_slots + config.base_inv_slots));
                }
                else if(row.armor == "none" && itemdata[equipitem].type == "armor"){
                    query(`UPDATE scores SET armor = '${equipitem}' WHERE userId = ${message.author.id}`);
                    //add armor defense % to sql table somewhere?
                    query(`UPDATE items SET ${equipitem} = ${row[equipitem] - 1} WHERE userId = ${message.author.id}`);
                    message.reply(lang.equip[1].replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem));
                }
                else if(row.banner == 'none' && itemdata[equipitem].isBanner){
                    query(`UPDATE scores SET banner = '${equipitem}' WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${equipitem} = ${row[equipitem] - 1} WHERE userId = ${message.author.id}`);
                    message.reply(lang.equip[1].replace('{-1}', itemdata[equipitem].icon).replace('{0}', equipitem));
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
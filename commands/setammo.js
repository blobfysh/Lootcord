const { query } = require('../mysql.js');
const general = require('../methods/general');
const itemdata = require('../json/completeItemList');
const methods = require('../methods/methods');

module.exports = {
    name: 'setammo',
    aliases: [''],
    description: 'Sets preferred ammo type.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let equipitem = general.parseArgsWithSpaces(args[0], args[1], args[2]);

        if(equipitem && equipitem.toLowerCase() == 'none'){
            await query(`UPDATE scores SET ammo = 'none' WHERE userId = ${message.author.id}`);

            return message.reply(`✅ Successfully cleared your preferred ammo type. (Best ammo available will be used.)`);
        }
        else if(!itemdata[equipitem]){
            return message.reply("❌ I don't recognize that item.");
        }
        else if(!itemdata[equipitem].isAmmo.length){
            return message.reply("❌ That isn't a type of ammunition.");
        }
        else if(!await methods.hasitems(message.author.id, equipitem, 1)){
            return message.reply("❌ You don't own that ammo.");
        }

        await query(`UPDATE scores SET ammo = '${equipitem}' WHERE userId = ${message.author.id}`);

        message.reply(`✅ Successfully set ${itemdata[equipitem].icon}\`${equipitem}\` as your preferred ammo type. (Will prioritize over other ammo types.)`);
    },
}
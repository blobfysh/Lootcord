
module.exports = {
    name: 'unequip',
    aliases: [''],
    description: 'Unequip an item.',
    long: 'Unequip your current backback, armor, or banner. Can also unequip your shield, but will give you an hour attack cooldown for doing so.',
    args: {"item/shield/banner": "Item to unequip."},
    examples: ["unequip light_pack", "unequip banner", "unequip shield", "unequip backpack"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const userRow = await app.player.getRow(message.author.id);
        let equipitem = app.parse.items(message.args)[0];

        if(userRow.backpack === equipitem || message.args[0] === "backpack"){
            if(userRow.backpack !== "none"){
                await app.query(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`);
                await app.query(`UPDATE scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id}`);
                await app.itm.addItem(message.author.id, userRow.backpack, 1);

                message.reply(`Successfully unequipped ${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\`.\nYour carry capacity is now **${app.config.baseInvSlots + (userRow.inv_slots - app.itemdata[userRow.backpack].inv_slots)}** items.`);
            }
            else{
                message.reply(`❌ You don't have a backpack equipped! You can check what backpacks you own in your \`inventory\`.`);
            }
        }

        else if(userRow.banner === equipitem || message.args[0] === "banner"){
            if(userRow.banner !== "none"){
                await app.query(`UPDATE scores SET banner = 'none' WHERE userId = ${message.author.id}`);
                await app.itm.addItem(message.author.id, userRow.banner, 1);

                message.reply(`Successfully unequipped ${app.itemdata[userRow.banner].icon}\`${userRow.banner}\`.`.replace('{-1}', app.itemdata[userRow.banner].icon).replace('{0}', userRow.banner));
            }
            else{
                message.reply(`❌ You don't have a banner equipped! You can check what banners you own on your \`profile\`.`);
            }
        }

        else if((equipitem && app.itemdata[equipitem].isShield) || message.args[0]  === 'shield'){
            const shieldCD = await app.cd.getCD(message.author.id, 'shield');
            if(!shieldCD){
                return message.reply("❌ You don't have a shield equipped!");
            }

            const attackCD = await app.cd.getCD(message.author.id, 'attack');
            if(attackCD){
                return message.reply(`❌ You cannot unequip your shield while you have an attack cooldown! \`${attackCD}\``);
            }

            await app.cd.setCD(message.author.id, 'attack', 3600 * 1000); // 1 hour attack cooldown
            await app.cd.clearCD(message.author.id, 'shield');
            
            message.reply(`Successfully unequipped your ${app.icons.items.shield}**shield**, you have also been given a \`60 minute\` cooldown from attacking other players.`);
        }

        else{
            message.reply("Specify a backpack, banner, or shield to unequip. `unequip <item>`");
        }
    },
}
/*
else if(userRow.armor === equipitem || equipitem === "armor"){
    if(userRow.armor !== "none"){
        query(`UPDATE scores SET armor = 'none' WHERE userId = ${message.author.id}`);
        methods.additem(message.author.id, userRow.armor, 1);

        message.reply(lang.unequip[2].replace('{-1}', itemdata[userRow.armor].icon).replace('{0}', userRow.armor));
    }
    else{
        message.reply(lang.unequip[3]);
    }
}
*/
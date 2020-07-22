
module.exports = {
    name: 'unequip',
    aliases: [''],
    description: 'Unequip an item.',
    long: 'Unequip your current storage container or banner. You can also unequip your armor, but you will receive a 1 hour attack cooldown for doing so.',
    args: {"item/armor/banner": "Item to unequip."},
    examples: ["unequip wood_box", "unequip banner", "unequip armor", "unequip storage"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const userRow = await app.player.getRow(message.author.id);
        let equipitem = app.parse.items(message.args)[0];
        let equipBadge = app.parse.badges(message.args)[0];

        if(userRow.backpack === equipitem || message.args[0] === "storage"){
            if(userRow.backpack !== "none"){
                await app.query(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`);
                await app.query(`UPDATE scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id}`);
                await app.itm.addItem(message.author.id, userRow.backpack, 1);

                message.reply(`✅ Successfully unequipped ${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\`.\nYour carry capacity is now **${app.config.baseInvSlots + (userRow.inv_slots - app.itemdata[userRow.backpack].inv_slots)}** items.`);
            }
            else{
                message.reply(`❌ You don't have a storage container equipped! You can check what containers you own in your \`inventory\`.`);
            }
        }

        else if(userRow.banner === equipitem || message.args[0] === "banner"){
            if(userRow.banner !== "none"){
                await app.query(`UPDATE scores SET banner = 'none' WHERE userId = ${message.author.id}`);
                await app.itm.addItem(message.author.id, userRow.banner, 1);

                message.reply(`✅ Successfully unequipped ${app.itemdata[userRow.banner].icon}\`${userRow.banner}\`.`);
            }
            else{
                message.reply(`❌ You don't have a banner equipped! You can check what banners you own on your \`profile\`.`);
            }
        }

        else if(equipBadge || message.args[0] === 'badge'){
            await app.query(`UPDATE scores SET badge = 'none' WHERE userId = ${message.author.id}`);

            return message.reply(`✅ Successfully unequipped your display badge!`);
        }

        else if((equipitem && app.itemdata[equipitem].isShield) || message.args[0]  === 'shield' || message.args[0] === 'armor'){
            const armorCD = await app.cd.getCD(message.author.id, 'shield');
            if(!armorCD){
                return message.reply("❌ You don't have any armor equipped!");
            }

            const armor = await app.player.getArmor(message.author.id);
            const attackCD = await app.cd.getCD(message.author.id, 'attack');
            if(attackCD){
                return message.reply(`❌ You cannot unequip your ${armor ? app.itemdata[armor].icon + '`' + armor + '`' : 'armor'} while you have an attack cooldown! \`${attackCD}\``);
            }

            await app.cd.setCD(message.author.id, 'attack', 3600 * 1000); // 1 hour attack cooldown
            await app.cd.clearCD(message.author.id, 'shield');
            
            message.reply(`✅ Successfully unequipped your ${armor ? app.itemdata[armor].icon + '`' + armor + '`' : 'armor'}, you have also been given a \`60 minute\` cooldown from attacking other players.`);
        }

        else{
            message.reply("Specify a storage container, banner, armor, or badge to unequip. `" + message.prefix + "unequip <item/badge>`");
        }
    },
}
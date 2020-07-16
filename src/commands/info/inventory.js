const { ITEM_TYPES } = require('../../resources/constants');

module.exports = {
    name: 'inventory',
    aliases: ['inv', 'i'],
    description: 'Displays all items you have.',
    long: 'Shows your current inventory including items, health, level, xp, and money.',
    args: {
        "@user/discord#tag": "User's profile to check."
    },
    examples: ["inv blobfysh#4679"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    execute(app, message){
        let member = app.parse.members(message, message.args)[0];

        // no member found in ArgParser
        if(!member){
            // player was trying to search someone
            if(message.args.length){
                message.reply('❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID');
                return;
            }
            
            makeInventory(message.member);
        }
        else{
            makeInventory(member);
        }

        async function makeInventory(member){
            try{
                const userRow = await app.player.getRow(member.id);
    
                if(!userRow){
                    return message.reply(`❌ The person you're trying to search doesn't have an account!`);
                }
                
                const isActive       = await app.player.isActive(member.id, member.guild.id);
                const itemObject     = await app.itm.getItemObject(member.id);
                const usersItems     = await app.itm.getUserItems(itemObject);
                const itemCt         = await app.itm.getItemCount(itemObject, userRow);
                const shieldLeft     = await app.cd.getCD(member.id, 'shield');
                const passiveShield  = await app.cd.getCD(member.id, 'passive_shield');

                let weaponList = usersItems.weapons;
                let itemList = usersItems.usables;
                let ammoList = usersItems.ammo;
                let materialList = usersItems.materials;
                let storageList = usersItems.storage;
                let backpack = userRow.backpack;

                const embedInfo = new app.Embed()
                .setTitle(`${isActive ? app.icons.accounts.active : app.icons.accounts.inactive} ${member.username + '#' + member.discriminator}'s Inventory`)
                .setColor(13451564)
                
                if(userRow.banner !== 'none'){
                    embedInfo.setImage(app.itemdata[userRow.banner].image);
                    embedInfo.setColor(app.itemdata[userRow.banner].bannerColor);
                }

                if(shieldLeft){
                    embedInfo.addField("🛡️ Shield", '`' + shieldLeft + '`');
                }
                if(passiveShield){
                    embedInfo.addField("🛡️ Passive Shield", '`' + passiveShield + '`');
                }

                embedInfo.addField("Health",`${app.player.getHealthIcon(userRow.health, userRow.maxHealth, true)}\n${userRow.health} / ${userRow.maxHealth}`, true)
                
                embedInfo.addField("Money", app.common.formatNumber(userRow.money), true)

                if(backpack === 'none'){
                    embedInfo.addField('Storage Container', 'None', true)
                }
                else{
                    embedInfo.addField('Storage Container', app.itemdata[backpack].icon + '`' + backpack + '`', true)
                }
                
                embedInfo.addBlankField();

                // item fields
                if(weaponList.length){
                    embedInfo.addField(ITEM_TYPES['weapons'].name, weaponList.join('\n'), true);
                }
                
                if(itemList.length){
                    embedInfo.addField(ITEM_TYPES['items'].name, itemList.join('\n'), true);
                }
                
                if(ammoList.length){
                    embedInfo.addField(ITEM_TYPES['ammo'].name, ammoList.join('\n'), true);
                }
                
                if(materialList.length){
                    embedInfo.addField(ITEM_TYPES['materials'].name, materialList.join('\n'), true);
                }
                
                if(storageList.length){
                    embedInfo.addField(ITEM_TYPES['storage'].name, storageList.join('\n'), true);
                }
                
                if(!weaponList.length && !itemList.length && !ammoList.length && !materialList.length && !storageList.length){
                    embedInfo.addField('This inventory is empty! :(', "\u200b");
                }

                embedInfo.addField("\u200b", "Inventory space: " + itemCt.capacity + " max | Value: " + app.common.formatNumber(usersItems.invValue + userRow.money) + '');
                
                await message.channel.createMessage(embedInfo);
            }
            catch(err){
                console.log(err);
                message.reply('❌ There was an error trying to fetch inventory. Make sure you mention the user.');
            }
        }
    },
}
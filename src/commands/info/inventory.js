const { RARITIES } = require('../../resources/constants');

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

                let ultraItemList    = usersItems.ultra;
                let legendItemList   = usersItems.legendary;
                let epicItemList     = usersItems.epic;
                let rareItemList     = usersItems.rare;
                let uncommonItemList = usersItems.uncommon;
                let commonItemList   = usersItems.common;
                let limitedItemList  = usersItems.limited;
                let backpack         = userRow.backpack;

                const embedInfo = new app.Embed()
                .setTitle(`${isActive ? app.icons.accounts.active : app.icons.accounts.inactive} ${member.username + '#' + member.discriminator}'s Inventory`)

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

                //embedInfo.addField('Level ' + userRow.level, `\`${xp.needed} xp until level ${userRow.level + 1}\``, true)

                if(backpack === 'none'){
                    embedInfo.addField('Backpack', 'None', true)
                }
                else{
                    embedInfo.addField('Backpack', app.itemdata[backpack].icon + '`' + backpack + '`', true)
                }
                
                embedInfo.addField('\u200b', '__**Items**__')

                // item fields
                if(ultraItemList != ""){
                    embedInfo.addField(RARITIES['ultra'].name, ultraItemList.join('\n'), true);
                }
                
                if(legendItemList != ""){
                    embedInfo.addField(RARITIES['legendary'].name, legendItemList.join('\n'), true);
                }
                
                if(epicItemList != ""){
                    embedInfo.addField(RARITIES['epic'].name, epicItemList.join('\n'), true);
                }
                
                if(rareItemList != ""){
                    embedInfo.addField(RARITIES['rare'].name, rareItemList.join('\n'), true);
                }
                
                if(uncommonItemList != ""){
                    embedInfo.addField(RARITIES['uncommon'].name, uncommonItemList.join('\n'), true);
                }
                
                if(commonItemList != ""){
                    embedInfo.addField(RARITIES['common'].name, commonItemList.join('\n'), true);
                }
                
                if(limitedItemList != ""){
                    embedInfo.addField(RARITIES['limited'].name, limitedItemList.join('\n'), true);
                }
                
                if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                    embedInfo.addField('This inventory is empty! :(', "\u200b");
                }

                //embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max | Value: " + app.common.formatNumber(usersItems.invValue, true))
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

module.exports = {
    name: 'getinv',
    aliases: ['geti'],
    description: 'Fetches a users inventory.',
    long: 'Fetches a users inventory using their ID.',
    args: {
        "User ID": "ID of user to check."
    },
    examples: ["getinv 168958344361541633"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];

        if(!userID){
            return message.reply('❌ You forgot to include a user ID.')
        }
        
        try{
            const row = await app.player.getRow(userID);

            if(!row){
                return message.reply('❌ User has no account.');
            }

            const userInfo       = await app.common.fetchUser(userID, { cacheIPC: false });
            const usersItems     = await app.itm.getUserItems(userID);
            const itemCt         = await app.itm.getItemCount(userID);
            const shieldLeft     = await app.cd.getCD(userID, 'shield');
            const xp             = app.common.calculateXP(row.points, row.level);

            let ultraItemList    = usersItems.ultra;
            let legendItemList   = usersItems.legendary;
            let epicItemList     = usersItems.epic;
            let rareItemList     = usersItems.rare;
            let uncommonItemList = usersItems.uncommon;
            let commonItemList   = usersItems.common;
            let limitedItemList  = usersItems.limited;

            const embedInfo = new app.Embed()
            .setTitle(`${userInfo.username}#${userInfo.discriminator}'s Inventory`)

            if(row.banner !== 'none'){
                embedInfo.setImage(app.itemdata[row.banner].image);
                embedInfo.setColor(app.itemdata[row.banner].bannerColor);
            }
            
            embedInfo.addField('Level ' + row.level, `\`${xp.needed} xp until level ${row.level + 1}\``, true)

            if(shieldLeft){
                embedInfo.addField("Shield Active", '🛡 `' + shieldLeft + '`', true);
            }

            embedInfo.addField("Health",`${app.player.getHealthIcon(row.health, row.maxHealth)} ${row.health}/${row.maxHealth}`)
            
            embedInfo.addField("Money", app.common.formatNumber(row.money))
            
            // item fields
            if(ultraItemList != ""){
                embedInfo.addField("Ultra", ultraItemList.join('\n'), true);
            }
            
            if(legendItemList != ""){
                embedInfo.addField("Legendary", legendItemList.join('\n'), true);
            }
            
            if(epicItemList != ""){
                embedInfo.addField("Epic", epicItemList.join('\n'), true);
            }
            
            if(rareItemList != ""){
                embedInfo.addField("Rare", rareItemList.join('\n'), true);
            }
            
            if(uncommonItemList != ""){
                embedInfo.addField("Uncommon", uncommonItemList.join('\n'), true);
            }
            
            if(commonItemList != ""){
                embedInfo.addField("Common", commonItemList.join('\n'), true);
            }
            
            if(limitedItemList != ""){
                embedInfo.addField("Limited", limitedItemList.join('\n'), true);
            }
            
            if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                embedInfo.addField('This inventory is empty! :(', "\u200b");
            }

            embedInfo.addField("\u200b", "Inventory space: " + itemCt.capacity + " max | Value: " + app.common.formatNumber(usersItems.invValue));
            
            message.channel.createMessage(embedInfo);
        }
        catch(err){
            message.reply('Error:```' + err + '```');
        }
    },
}
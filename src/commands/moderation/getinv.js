
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

            let ultraItemList    = usersItems.ultra;
            let legendItemList   = usersItems.legendary;
            let epicItemList     = usersItems.epic;
            let rareItemList     = usersItems.rare;
            let uncommonItemList = usersItems.uncommon;
            let commonItemList   = usersItems.common;
            let limitedItemList  = usersItems.limited;
            let backpack         = row.backpack;

            const embedInfo = new app.Embed()
            .setTitle(`${userInfo.username}#${userInfo.discriminator}'s Inventory`)

            if(row.banner !== 'none'){
                embedInfo.setImage(app.itemdata[row.banner].image);
                embedInfo.setColor(app.itemdata[row.banner].bannerColor);
            }

            if(shieldLeft){
                embedInfo.addField("🛡️ Shield", '`' + shieldLeft + '`');
            }

            embedInfo.addField("Health",`${app.player.getHealthIcon(row.health, row.maxHealth)} ${row.health} / ${row.maxHealth}`, true)
            
            embedInfo.addField("Money", app.common.formatNumber(row.money), true)

            if(backpack === 'none'){
                embedInfo.addField('Backpack', 'None', true)
            }
            else{
                embedInfo.addField('Backpack', app.itemdata[backpack].icon + '`' + backpack + '`', true)
            }
            
            embedInfo.addField('\u200b', '__**Items**__')

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
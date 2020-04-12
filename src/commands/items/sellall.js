const VALID_OPTIONS = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'limited'];

module.exports = {
    name: 'sellall',
    aliases: [''],
    description: 'Sell multiple items at once.',
    long: 'Sell all items of a certain rarity. If no rarity is specified, it will sell all items in your inventory.',
    args: {"rarity": "**OPTIONAL** Rarity of items you want to sell ie. common, rare..."},
    examples: ["sellall rare"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let sellItem = message.args[0] || '';

        if(VALID_OPTIONS.includes(sellItem.toLowerCase())){
            let commonTotal = 0;
            let totalAmount = 0;
            
            // filter items by rarity and exclude banners
            let itemsToCheck = Object.keys(app.itemdata).filter(item => {
                return app.itemdata[item].rarity.toLowerCase() === sellItem.toLowerCase() && !app.itemdata[item].isBanner
            })

            if(itemsToCheck.length < 1){
                return message.reply(`You need to enter a valid type to sell! \`${message.prefix}sellall <rarity>\``);
            }
            
            const itemRow = await app.itm.getItemObject(message.author.id);
            //iterate array and sell
            for (var i = 0; i < itemsToCheck.length; i++) {
                if(itemRow[itemsToCheck[i]] >= 1){
                    totalAmount += itemRow[itemsToCheck[i]];
                    commonTotal += (itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                }
            }
            if(totalAmount <= 0){
                return message.reply("❌ You don't have any items of that quality.");
            }

            const botMessage = await message.reply(`Sell ${totalAmount}x \`${sellItem.toLowerCase()}\` items for ${app.common.formatNumber(commonTotal)}?`);
            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const itemRow2 = await app.itm.getItemObject(message.author.id);

                    let testAmount = 0; // used to verify user didnt alter inventory while selling.
                    let testTotalItems = 0;
                    for (var i = 0; i < itemsToCheck.length; i++){
                        if(itemRow2[itemsToCheck[i]] >= 1){
                            testTotalItems += itemRow2[itemsToCheck[i]];
                            testAmount += (itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    
                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                        //VERIFIED
                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow2[itemsToCheck[i]] !== undefined) app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]]);
                        }
                        await app.player.addMoney(message.author.id, parseInt(commonTotal));

                        botMessage.edit(`Successfully sold all ${sellItem.toLowerCase()} items.`);
                    }
                    else{
                        botMessage.edit('❌ Sellall failed. Your inventory was altered during the sale.');
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time.");
            }
        }
        else if(sellItem == ''){
            let commonTotal = 0;
            let totalAmount = 0;

            // filter out limited items and banners
            let itemsToCheck = Object.keys(app.itemdata).filter(item => {
                return app.itemdata[item].rarity !== 'Limited' && !app.itemdata[item].isBanner
            });

            const itemRow = await app.itm.getItemObject(message.author.id);

            for (var i = 0; i < itemsToCheck.length; i++) {
                if(itemRow[itemsToCheck[i]] >= 1){
                    totalAmount += itemRow[itemsToCheck[i]];
                    commonTotal += (itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                }
            }

            if(totalAmount <= 0){
                return message.reply("❌ You don't have any items you can sell.");
            }

            const botMessage = await message.reply(`Sell ${totalAmount}x items for ${app.common.formatNumber(commonTotal)}?`.replace('{0}', totalAmount));

            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const itemRow2 = await app.itm.getItemObject(message.author.id);

                    let testAmount = 0;
                    let testTotalItems = 0;
                    for (var i = 0; i < itemsToCheck.length; i++) {
                        if(itemRow2[itemsToCheck[i]] >= 1){
                            testTotalItems += itemRow2[itemsToCheck[i]];
                            testAmount += (itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    
                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow2[itemsToCheck[i]] !== undefined) app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]]);
                        }
                        await app.player.addMoney(message.author.id, parseInt(commonTotal));

                        botMessage.edit('Successfully sold all items.');
                    }
                    else{
                        botMessage.edit('❌ Sellall failed. Your inventory was altered during the sale.');
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time.");
            }
        }
        else{
            message.reply('You need to enter a valid item rarity to sell! Ex. `sellall epic`');
        }
    },
}
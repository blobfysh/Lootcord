
module.exports = {
    name: 'sell',
    aliases: [''],
    description: 'Sell items for money.',
    long: 'Sell items for money. Check the `shop` to see how much items can be sold for.',
    args: {"item": "Item to sell.", "amount": "**OPTIONAL** Amount of item to sell."},
    examples: ["sell iron_shield 3"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let sellItem = app.parse.items(message.args)[0];
        let sellAmount = app.parse.numbers(message.args)[0] || 1;

        if(sellItem){
            const userItems = await app.itm.getItemObject(message.author.id);
            const hasItems = await app.itm.hasItems(userItems, sellItem, sellAmount);
            let itemPrice = app.itemdata[sellItem].sell;
            
            if(!hasItems){
                return message.reply(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`);
            }
            
            if(itemPrice !== ""){
                if(sellAmount > 30){
                    sellAmount = 30;
                }

                const botMessage = await message.reply(`Sell ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(itemPrice * sellAmount)}?`);
                
                try{
                    const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                    if(confirmed){
                        const userItems = await app.itm.getItemObject(message.author.id);
                        const hasItems = await app.itm.hasItems(userItems, sellItem, sellAmount);

                        if(hasItems){
                            const row = await app.player.getRow(message.author.id);

                            app.player.addMoney(message.author.id, parseInt(itemPrice * sellAmount));
                            app.itm.removeItem(message.author.id, sellItem, sellAmount);
                            botMessage.edit(`Successfully sold ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(itemPrice * sellAmount)}.\n\nYou now have ${app.common.formatNumber(row.money + (itemPrice * sellAmount))}.`);
                        }
                        else{
                            botMessage.edit(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`);
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
                message.reply("❌ You can't sell that item!");
            }
        }
        else{
            message.reply(`You need to enter a valid item to sell! \`${message.prefix}sell <item> <amount>\``);
        }
    },
}
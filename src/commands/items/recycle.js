
module.exports = {
    name: 'recycle',
    aliases: [''],
    description: 'Break items down into parts!',
    long: 'Recycle `legendary` quality items for components.',
    args: {"item": "Item to recycle.", "amount": "**OPTIONAL** Amount of item to recycle."},
    examples: ["recycle awp 2"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let sellItem = app.parse.items(message.args)[0];
        let sellAmount = app.parse.numbers(message.args)[0] || 1;

        if(sellItem){
            if(app.itemdata[sellItem].recyclesTo == ""){
                return message.reply('That item cannot be recycled.');
            }

            if(sellAmount > 20) sellAmount = 20;

            let itemMats = getItemMats(app.itemdata[sellItem].recyclesTo.materials, sellAmount);

            const embedInfo = new app.Embed()
            .setDescription(`Recycle **${sellAmount}x** ${app.itemdata[sellItem].icon}\`${sellItem}\` for:\n\n${app.itm.getDisplay(itemMats).join('\n')}`)
            .setColor('#4CAD4C')
            .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/601373249753841665/recycle.png")
            .setFooter("You will need " + (app.itm.getTotalItmCountFromList(itemMats) - sellAmount) + " open slots in your inventory to recycle this.")
            
            const botMessage = await message.channel.createMessage({content: `<@${message.author.id}>`, embed : embedInfo.embed});

            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const userItems = await app.itm.getItemObject(message.author.id);
                    const itemCt = await app.itm.getItemCount(userItems, await app.player.getRow(message.author.id));

                    if(!await app.itm.hasItems(userItems, sellItem, sellAmount)){
                        embedInfo.setColor(16734296)
                        embedInfo.embed.thumbnail = undefined;
                        embedInfo.embed.footer = undefined;
                        embedInfo.setDescription(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`);
                        return botMessage.edit(embedInfo);
                    } 
                        
                    if(!await app.itm.hasSpace(itemCt, app.itm.getTotalItmCountFromList(itemMats) - sellAmount)){
                        embedInfo.setColor(16734296)
                        embedInfo.embed.thumbnail = undefined;
                        embedInfo.embed.footer = undefined;
                        embedInfo.setDescription(`❌ **You don't have enough space in your inventory!** (You need **${app.itm.getTotalItmCountFromList(itemMats) - sellAmount}** open slot${app.itm.getTotalItmCountFromList(itemMats) - sellAmount > 1 ? 's': ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`);
                        return botMessage.edit(embedInfo);
                    }

                    await app.itm.addItem(message.author.id, itemMats);
                    await app.itm.removeItem(message.author.id, sellItem, sellAmount);

                    embedInfo.setColor(9043800)
                    embedInfo.setDescription(`Successfully recycled **${sellAmount}x** ${app.itemdata[sellItem].icon}\`${sellItem}\` for:\n\n${app.itm.getDisplay(itemMats).join('\n')}`)
                    botMessage.edit(embedInfo);
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                const errorEmbed = new app.Embed()
                .setColor(16734296)
                .setDescription('❌ Command timed out.');
                botMessage.edit(errorEmbed);
            }
        }
        else{
            message.reply("I don't recognize that item. `" + message.prefix + "recycle <item>`");
        }
    },
}

function getItemMats(itemMats, recycleAmount){
    var itemPrice = [];

    for(var i = 0; i < itemMats.length; i++){
        let matAmount = itemMats[i].split('|');

        itemPrice.push(matAmount[0] + '|' + (matAmount[1] * recycleAmount));
    }

    return itemPrice;
}
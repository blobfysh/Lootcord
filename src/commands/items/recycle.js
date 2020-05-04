
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
        let sellAmount = app.parse.numbers(message.args)[0] || 1;
        let sellItem = app.parse.items(message.args)[0];

        if(sellItem){
            if(app.itemdata[sellItem].recyclesTo == ""){
                return message.reply('That item cannot be recycled.');
            }

            if(sellAmount > 20) sellAmount = 20;

            let itemMats = getItemMats(app.itemdata[sellItem].recyclesTo.materials, sellAmount);

            const embedInfo = new app.Embed()
            .setTitle(`Recycle ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for`)
            .setDescription(app.itm.getDisplay(itemMats).join('\n'))
            .setColor('#4CAD4C')
            .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/601373249753841665/recycle.png")
            .setFooter("You will need " + app.itm.getTotalItmCountFromList(itemMats) + " open slots in your inventory to recycle this.")
            
            const botMessage = await message.channel.createMessage({content: `<@${message.author.id}>`, embed : embedInfo.embed});

            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    if(!await app.itm.hasItems(message.author.id, sellItem, sellAmount)){
                        embedInfo.setColor(16734296)
                        embedInfo.setTitle('Failed to Recycle!')
                        embedInfo.setDescription(`❌ You don't have enough of that item.`);
                        return botMessage.edit(embedInfo);
                    } 
                        
                    if(!await app.itm.hasSpace(message.author.id, app.itm.getTotalItmCountFromList(itemMats))){
                        embedInfo.setColor(16734296)
                        embedInfo.setTitle('Failed to Recycle!')
                        embedInfo.setDescription(`❌ **You don't have enough space in your inventory!**\nYou can clear up space by selling some items.`);
                        return botMessage.edit(embedInfo);
                    }

                    await app.itm.addItem(message.author.id, itemMats);
                    await app.itm.removeItem(message.author.id, sellItem, sellAmount);

                    embedInfo.setColor(9043800)
                    embedInfo.setTitle('Success!')
                    embedInfo.setDescription(`You recycled ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for:\n${getMatsDisplay(app, itemMats)}`)
                    botMessage.edit(embedInfo);
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                embedInfo.setFooter('❌ Command timed out.');
                botMessage.edit(embedInfo);
            }
        }
        else{
            message.reply("I don't recognize that item. `recycle <item>`");
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
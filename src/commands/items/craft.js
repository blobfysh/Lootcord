
module.exports = {
    name: 'craft',
    aliases: [''],
    description: 'Craft new items!',
    long: 'Use components from `recycling` to craft items such as:\n`rail_cannon`\n`ray_gun`\n`ultra_box`.',
    args: {"item": "Item to craft.", "amount": "**OPTIONAL** Amount of items to craft."},
    examples: ["craft rail_cannon 2"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let craftAmount = app.parse.numbers(message.args)[0] || 1;
        let craftItem = app.parse.items(message.args)[0];

        if(craftItem){
            if(app.itemdata[craftItem].craftedWith == ""){
                return message.reply('That item cannot be crafted!');
            }
            
            if(craftAmount > 20) craftAmount = 20;

            let itemMats = getItemMats(app.itemdata[craftItem].craftedWith.materials, craftAmount);

            const embedInfo = new app.Embed()
            .setTitle(`Craft ${craftAmount}x ${app.itemdata[craftItem].icon}\`${craftItem}\` for`)
            .setDescription(app.itm.getDisplay(itemMats).join('\n'))
            .setColor('#818181')
            .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/601372871301791755/craft.png")

            const botMessage = await message.channel.createMessage({content: `<@${message.author.id}>`, embed : embedInfo.embed});
            
            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);
                
                if(confirmed){
                    const hasEnough = await app.itm.hasItems(message.author.id, itemMats);
                    if(hasEnough){
                        await app.itm.removeItem(message.author.id, itemMats);
                        await app.itm.addItem(message.author.id, craftItem, craftAmount);

                        embedInfo.setColor(9043800)
                        embedInfo.setTitle('Success!')
                        embedInfo.setDescription(`You crafted ${craftAmount}x ${app.itemdata[craftItem].icon}\`${craftItem}\``)
                        botMessage.edit(embedInfo);
                    }
                    else{
                        embedInfo.setColor(16734296)
                        embedInfo.setTitle('Failed to Craft!')
                        embedInfo.setDescription(`You are missing the required materials for this item!`)
                        botMessage.edit(embedInfo);
                    }
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
            message.reply("I don't recognize that item. `" + message.prefix + "craft <item>`");
        }
    },
}

function getItemMats(itemMats, craftAmount){
    var itemPrice = [];

    for(var i = 0; i < itemMats.length; i++){
        let matAmount = itemMats[i].split('|');

        itemPrice.push(matAmount[0] + '|' + (matAmount[1] * craftAmount));
    }

    return itemPrice;
}
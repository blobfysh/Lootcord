const shortid   = require('shortid');
const listing_fee = 0.10;
const max_listings = 15;

module.exports = {
    name: 'blackmarketlist',
    aliases: ['bmlist', 'bmsell'],
    description: 'Add a new listing to the Black Market.',
    long: 'Sell an item of your own on the Black Market for other players to buy! Listing an item has a fee of 10% of the price.',
    args: {},
    examples: ["bmlist box 1 2000", "bmlist"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let itemAmnt = app.parse.numbers(message.args)[0];
        let itemCost = app.parse.numbers(message.args)[1];
        let itemName = app.parse.items(message.args)[0];

        if(await app.cd.getCD(message.author.id, 'tradeban')){
            return message.reply("❌ You are trade banned.");
        }
        else if((await app.query(`SELECT * FROM blackmarket WHERE sellerId = ${message.author.id}`)).length >= max_listings){
            return message.reply("❌ You have " + max_listings + " listings on the market already! Remove some or wait for them to sell.");
        }
        else if(itemName && itemAmnt && itemCost){
            // skip listing process...
            if(!await app.itm.hasItems(message.author.id, itemName, 1)){
                return message.reply('You don\'t have that item.');
            }
            else if(!app.itemdata[itemName].canBeStolen){
                return message.reply('That item cannot be sold on the market!');
            }
            else if(itemAmnt >= 2147483647){
                return message.reply('Please enter a lower value.');
            }
            else if(!await app.itm.hasItems(message.author.id, itemName, itemAmnt)){
                return message.reply('You don\'t have enough of that item.'); 
            }
            else if(itemCost >= 2147483647){
                return message.reply('Please enter a lower price o.o');
            }
            else if(itemCost < 100){
                return message.reply('Please enter a higher price! Minimum ' + app.common.formatNumber(100));
            }
            else if(itemCost <= (app.itemdata[itemName].sell * itemAmnt)){
                return message.reply('You can `sell` that for more money! You should list for more money, or sell them to the bot instead.');
            }
            const bmEmbed = new app.Embed()
            .setTitle('List an item on the Black Market')
            .addField('Item:', app.itemdata[itemName].icon + '`' + itemName + '`')
            .addField('Quantity:', itemAmnt)
            .addField('Price:', app.common.formatNumber(itemCost))
            .setColor(13215302)

            let listingFee = Math.floor(itemCost * listing_fee);
            const botMessage = await message.channel.createMessage({content: '<@' + message.author.id + '>, This will cost ' + app.common.formatNumber(listingFee) + ' ('+ listing_fee * 100 + '%) to list. Are you sure?', embed: bmEmbed.embed});

            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    if(!await app.player.hasMoney(message.author.id, listingFee)){
                        return botMessage.edit({content: `Listing failed! You can't afford the ${app.common.formatNumber(listingFee)} fee.`, embed: null});
                    }
                    else if(!await app.itm.hasItems(message.author.id, itemName, itemAmnt)){
                        return botMessage.edit({content: `Listing failed! You don't have **${itemAmnt}** \`${itemName}\`'s.`, embed: null});
                    }
                    await app.player.removeMoney(message.author.id, listingFee);
                    await app.itm.removeItem(message.author.id, itemName, itemAmnt);

                    let listingId = await listItem(app, message, itemName, itemAmnt, itemCost);

                    return botMessage.edit(`Success! Your ${app.itemdata[itemName].icon}\`${itemName}\` was listed with the ID: \`${listingId}\`.`, {embed: null});
                }
                else{
                    botMessage.delete();
                }
            }
            catch(e){
                botMessage.edit('❌ You didn\'t react in time!');
            }
        }
        else{
            // step by step listing...
            let item, amount, price;

            const bmEmbed = new app.Embed()
            .setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
            .setTitle('List an item on the Black Market')
            .setDescription('Enter the name of the item you would like to list:')
            .setFooter('Type cancel to stop the command.')
            .setColor(13215302)

            try{
                app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => {
                    return m.author.id === message.author.id
                }, { time: 60000 });

                let botMessage = await message.channel.createMessage(bmEmbed);

                const collector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;

                collector.on('collect', async m => {
                    let newArgs = m.content.split(/ +/);
                    let newItem = app.parse.items(newArgs)[0];

                    if(m.content.toLowerCase() == 'cancel' || m.content.toLowerCase() == 'stop'){
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);

                        return message.reply('Listing canceled.');
                    }
                    else if(newItem && !item){
                        if(!await app.itm.hasItems(message.author.id, newItem, 1)){
                            return m.channel.createMessage('You don\'t have that item.');
                        }
                        else if(!app.itemdata[newItem].canBeStolen){
                            return m.channel.createMessage('That item cannot be sold on the market!');
                        }
                        item = newItem;
                        bmEmbed.addField('Item:', app.itemdata[item].icon + ' `' + item + '`', true);
                        bmEmbed.setDescription('Enter the amount to sell:')
                        botMessage = await message.channel.createMessage(bmEmbed);
                        return;
                    }
                    else if(!item){
                        return m.channel.createMessage('I don\'t recognize that item.');
                    }

                    let newAmnt = app.parse.numbers(newArgs)[0];

                    if(newAmnt && !amount){
                        if(newAmnt >= 2147483647){
                            return m.channel.createMessage('Please enter a lower value.');
                        }
                        else if(!await app.itm.hasItems(message.author.id, item, newAmnt)){
                            return m.channel.createMessage('You don\'t have enough of that item.'); 
                        }
                        amount = newAmnt;
                        bmEmbed.addField('Quantity:', amount, true);
                        bmEmbed.setDescription('Enter the price for all **' + amount + '**:')
                        botMessage = await message.channel.createMessage(bmEmbed);
                        return;
                    }
                    else if(!amount){
                        return m.channel.createMessage('Please enter a valid amount.');
                    }

                    let newCost = app.parse.numbers(newArgs)[0];

                    if(newCost && !price){
                        if(newCost >= 2147483647){
                            return m.channel.createMessage('Please enter a lower value.');
                        }
                        else if(newCost < 100){
                            return m.channel.createMessage('Please enter a higher price! Minimum ' + app.common.formatNumber(100));
                        }
                        else if(newCost <= (app.itemdata[item].sell * amount)){
                            return m.channel.createMessage('You can `sell` that for more money! You should list for more money, or sell them using the sell command instead.');
                        }

                        price = newCost;
                        listingFee = Math.floor(price * listing_fee);
                        bmEmbed.addField('Price:', app.common.formatNumber(price));
                        bmEmbed.setDescription(`List **${amount}x** \`${item}\` for ${app.common.formatNumber(price)}?`);
                        botMessage = await message.channel.createMessage({content: '<@' + message.author.id + '>, This will cost ' + app.common.formatNumber(listingFee) + ' to list. Are you sure?', embed: bmEmbed.embed});
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                        try{
                            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);
    
                            if(confirmed){
                                if(!await app.player.hasMoney(message.author.id, listingFee)){
                                    return botMessage.edit({content: `Listing failed! You can't afford the ${app.common.formatNumber(listingFee)} fee.`, embed: null});
                                }
                                else if(!await app.itm.hasItems(message.author.id, item, amount)){
                                    return botMessage.edit({content: `Listing failed! You don't have **${amount}** \`${item}\`'s.`, embed: null});
                                }
                                await app.player.removeMoney(message.author.id, listingFee);
                                await app.itm.removeItem(message.author.id, item, amount);
    
                                let listingId = await listItem(app, message, item, amount, price);
    
                                return botMessage.edit({content: `Success! Your \`${item}\` was listed with the ID: \`${listingId}\`.`, embed: null});
                            }
                            else{
                                botMessage.delete();
                            }
                        }
                        catch(e){
                            botMessage.edit('❌ You didn\'t react in time!');
                        }
                    }
                });
                collector.on('end', reason => {
                    if(reason === 'time'){
                        bmEmbed.setFooter('❌ Command timed out.');
                        botMessage.edit(bmEmbed);
                    }
                });
            }
            catch(err){
                return message.reply('❌ There was an error starting the command, you may have another command waiting for your input. If you believe this is an issue with the bot, join the support `discord`.');
            }
        }
    },
}

async function listItem(app, message, item, amount, price){
    let listId = shortid.generate();
    let pricePer = Math.floor(price / amount);

    const BMrow = await app.query(insertBMSQL, [
        listId, 
        message.author.id,
        item,
        price,
        amount,
        pricePer,
        message.author.username,
        new Date().getTime()
    ]);

    return listId;
}

const insertBMSQL = `
INSERT IGNORE INTO blackmarket (
    listingId,
    sellerId,
    itemName,
    price,
    quantity,
    pricePer,
    sellerName,
    listTime)
    VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?
    )
`
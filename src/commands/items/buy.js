const shortid = require('shortid');

module.exports = {
    name: 'buy',
    aliases: ['purchase'],
    description: 'Purchase items and games with currency.',
    long: 'Purchase items with currency. Check the `shop` to see what can be bought.',
    args: {"item": "Item to buy.", "amount": "**OPTIONAL** Amount of items to purchase."},
    examples: ["buy item_box 2"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const gamesRow = await getGamesData(app);
        let buyAmount = app.parse.numbers(message.args)[0] || 1;
        let buyItem = app.parse.items(message.args)[0];

        if(buyItem){
            let currency = app.itemdata[buyItem].buy.currency;
            let itemPrice = app.itemdata[buyItem].buy.amount;

            if(itemPrice == undefined){
                return message.reply('That item is not for sale!');
            }
            
            if(buyAmount > 20) buyAmount = 20;

            if(currency == 'money'){
                const botMessage = await message.channel.createMessage(`Purchase ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\` for ${app.common.formatNumber(itemPrice * buyAmount)}?`);

                try{
                    const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                    if(confirmed){
                        const hasSpace = await app.itm.hasSpace(message.author.id, buyAmount);
                        const hasMoney = await app.player.hasMoney(message.author.id, itemPrice * buyAmount);
                        
                        if(!hasMoney){
                            return botMessage.edit("You don't have enough money!");
                        }
                        if(!hasSpace){
                            return botMessage.edit("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
                        }

                        await app.player.removeMoney(message.author.id, itemPrice * buyAmount);
                        await app.itm.addItem(message.author.id, buyItem, buyAmount);

                        botMessage.edit(`Successfully bought ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\`!`);
                    }
                    else{
                        botMessage.delete();
                    }
                }
                catch(err){
                    botMessage.edit('You ran out of time.');
                }
            }
            else{
                const botMessage = await message.channel.createMessage(`Purchase ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\` for ${itemPrice * buyAmount + 'x ' + app.itemdata[currency].icon + '`' +currency + '`'}?`);

                try{
                    const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                    if(confirmed){
                        // if user bought 3 rpgs at 5 tokens each, they would need 3 - 15 = -12 space in their inventory
                        // if they had 20/10 slots at time of purchasing, this would return true because 20 - 12 = 8/10 slots
                        const hasItems = await app.itm.hasItems(message.author.id, currency, itemPrice * buyAmount);
                        const hasSpace = await app.itm.hasSpace(message.author.id, buyAmount - (buyAmount * itemPrice));
                        
                        if(!hasItems){
                            return botMessage.edit(`You are missing the following items needed to purchase this: ${itemPrice * buyAmount}x ${app.itemdata[currency].icon}\`${currency}\``);
                        }
                        if(!hasSpace){
                            return botMessage.edit("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
                        }

                        await app.itm.removeItem(message.author.id, currency, itemPrice * buyAmount);
                        await app.itm.addItem(message.author.id, buyItem, buyAmount);

                        botMessage.edit(`Successfully bought ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\`!`);
                    }
                    else{
                        botMessage.delete();
                    }
                }
                catch(err){
                    botMessage.edit('You ran out of time.');
                }
            }
        }
        else if(gamesRow[message.args[0]] !== undefined){
            // code for buying game here
            buyItem = message.args[0];
            let gameAmount = gamesRow[buyItem].gameAmount;
            let currency = gamesRow[buyItem].gameCurrency;
            let itemPrice = gamesRow[buyItem].gamePrice;
            let gameName = gamesRow[buyItem].gameDisplay;
            buyAmount = 1;

            if(gameAmount <= 0){
                return message.reply("That game is sold out! 😞");
            }

            if(currency == 'money'){
                const botMessage = await message.channel.createMessage(`Purchase \`${gameName}\` for ${app.common.formatNumber(itemPrice)}?`);

                try{
                    const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                    if(confirmed){
                        const hasMoney = await app.player.hasMoney(message.author.id, itemPrice * buyAmount);
                        
                        if(!hasMoney){
                            return botMessage.edit("You don't have enough money!");
                        }

                        await app.player.removeMoney(message.author.id, itemPrice);

                        boughtGame(app, message.author, gamesRow[buyItem]);
                        botMessage.edit(`Successfully bought ${gameName}!`);
                    }
                    else{
                        botMessage.delete();
                    }
                }
                catch(err){
                    botMessage.edit('You ran out of time.');
                }
            }
            else{
                const botMessage = await message.channel.createMessage(`Purchase \`${gameName}\` for ${itemPrice}x ${app.itemdata[currency].icon}\`${currency}\`?`);

                try{
                    const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                    if(confirmed){
                        const hasItems = await app.itm.hasItems(message.author.id, currency, itemPrice);
                        
                        if(!hasItems){
                            return botMessage.edit(`You are missing the following items needed to purchase this: ${itemPrice}x ${app.itemdata[currency].icon}\`${currency}\``);
                        }

                        await app.itm.removeItem(message.author.id, currency, itemPrice);

                        boughtGame(app, message.author, gamesRow[buyItem]);
                        botMessage.edit(`Successfully bought ${gameName}!`);
                    }
                    else{
                        botMessage.delete();
                    }
                }
                catch(err){
                    botMessage.edit('You ran out of time.');
                }
            }
            
        }
        else if(shortid.isValid(message.args[0]) && await app.bm.getListingInfo(message.args[0])){
            buyItem = message.args[0];

            let listInfo = await app.bm.getListingInfo(buyItem);
            
            if(await app.cd.getCD(message.author.id, 'tradeban')){
                return message.reply("❌ You are trade banned and cannot use the black market.");
            }

            const botMessage = await message.channel.createMessage(`Purchase ${listInfo.amount}x ${app.itemdata[listInfo.item].icon}\`${listInfo.item}\` for ${app.common.formatNumber(listInfo.price)}?`);

            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const hasSpace = await app.itm.hasSpace(message.author.id, listInfo.amount);
                    const hasMoney = await app.player.hasMoney(message.author.id, listInfo.price);
                    
                    if(!hasMoney){
                        return botMessage.edit("❌ You don't have enough money!");
                    }
                    if(!hasSpace){
                        return botMessage.edit("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
                    }
                    if(!await app.bm.getListingInfo(listInfo.listingId)){
                        return botMessage.edit('❌ That listing already sold!');
                    }

                    app.bm.soldItem(listInfo);
                    await app.player.removeMoney(message.author.id, listInfo.price);
                    await app.itm.addItem(message.author.id, listInfo.item, listInfo.amount);

                    botMessage.edit(`Successfully bought ${listInfo.amount}x ${app.itemdata[listInfo.item].icon}\`${listInfo.item}\`!`);
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit('You ran out of time.');
            }
        }
        else{
            message.reply(`You need to enter a valid item to buy! \`${message.prefix}buy <item> <amount>\``);
        }
    },
}

/*
async function buyitem(message, buyItem, buyAmount, itemPrice, currency, isGame = false, lang, bmListingInfo = ''){
    let displayPrice = currency == 'money' ? methods.formatMoney(itemPrice * (bmListingInfo ? 1 : buyAmount)) :                 itemPrice * buyAmount + "x " + itemdata[currency].icon + "`" + currency + "`";

    const botMessage = bmListingInfo ? await message.reply(lang.buy[6].replace('{0}', buyAmount).replace('{1}', itemdata[buyItem].icon).replace('{2}', buyItem).replace('{3}', displayPrice).replace('{4}', bmListingInfo.sellerName))
    : await message.reply(lang.buy[2].replace('{0}', buyAmount).replace('{1}', isGame == false ? itemdata[buyItem].icon : '').replace('{2}', buyItem).replace('{3}', displayPrice));
    await botMessage.react('✅');
    await botMessage.react('❌');
    const filter = (reaction, user) => {
        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
    };

    try{
        const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
        const reaction = collected.first();

        if(reaction.emoji.name === '✅'){
            botMessage.delete();
            if(isGame){
                if(currency == 'money'){
                    const hasMoney = await methods.hasmoney(message.author.id, itemPrice);
                    if(hasMoney){
                        const gameRow = await query(`SELECT * FROM gamesData WHERE gameName = '${buyItem}'`);

                        query(`UPDATE gamesData SET gameAmount = ${gameRow[0].gameAmount - 1} WHERE gameName = '${buyItem}'`);

                        methods.removemoney(message.author.id, itemPrice);
                        
                        message.reply("Successfully bought `" + buyItem + "`!");

                        const buyerEmbed = new Discord.RichEmbed()
                        .setTitle("✅ Game Purchased!")
                        .setDescription("The moderators have received confirmation that you purchased a game and will respond with your key soon.")
                        .setFooter('Please do not message asking "Where is my code?" unless atleast 12 hours have passed. We have the right to cancel this purchase if we suspect you of cheating.')
                        .setTimestamp()
                        message.author.send(buyerEmbed);

                        return message.client.shard.broadcastEval(`
                            const channel = this.channels.get('${config.modChannel}');
                    
                            if(channel){
                                channel.send({embed: {
                                        title: "✅ Game Purchased!",
                                        fields: [
                                            {
                                                name: "Game Sold",
                                                value: "**${gameRow[0].gameDisplay}**",
                                            },
                                            {
                                                name: "Buyer",
                                                value: "${message.author.tag} ID: \`\`\`${message.author.id}\`\`\`",
                                            },
                                        ],
                                    }
                                });
                                true;
                            }
                            else{
                                false;
                            }
                        `).then(console.log);
                    }
                    else{
                        message.reply(lang.buy[5].replace('{0}', displayPrice));
                    }
                }
                else{
                    const hasItems = await methods.hasitems(message.author.id, currency, itemPrice);

                    if(hasItems){
                        const gameRow = await query(`SELECT * FROM gamesData WHERE gameName = '${buyItem}'`);

                        query(`UPDATE gamesData SET gameAmount = ${gameRow[0].gameAmount - 1} WHERE gameName = '${buyItem}'`);

                        methods.removeitem(message.author.id, currency, itemPrice);
                        
                        message.reply("Successfully bought `" + buyItem + "`!");

                        const buyerEmbed = new Discord.RichEmbed()
                        .setTitle("✅ Game Purchased!")
                        .setDescription("The moderators have received confirmation that you purchased a game and will respond with your key soon.")
                        .setFooter('Please do not message asking "Where is my code?" unless atleast 12 hours have passed. We have the right to cancel this purchase if we suspect you of cheating.')
                        .setTimestamp()
                        message.author.send(buyerEmbed);

                        return message.client.shard.broadcastEval(`
                            const channel = this.channels.get('${config.modChannel}');
                    
                            if(channel){
                                channel.send({embed: {
                                        title: "✅ Game Purchased!",
                                        fields: [
                                            {
                                                name: "Game Sold",
                                                value: "**${gameRow[0].gameDisplay}**",
                                            },
                                            {
                                                name: "Buyer",
                                                value: "${message.author.tag} ID: \`\`\`${message.author.id}\`\`\`",
                                            },
                                        ],
                                    }
                                });
                                true;
                            }
                            else{
                                false;
                            }
                        `).then(console.log);
                    }
                    else{
                        message.reply(lang.buy[5].replace('{0}', displayPrice));
                    }
                }
            }
            else if(currency == 'money'){
                const hasSpace = await methods.hasenoughspace(message.author.id, parseInt(buyAmount));
                const hasMoney = await methods.hasmoney(message.author.id, itemPrice * (bmListingInfo ? 1 : buyAmount));

                if(hasMoney && hasSpace){
                    if(bmListingInfo && !await bm_methods.getListingInfo(bmListingInfo.listingId)){
                        return message.reply('That listing already sold!');
                    }
                    methods.additem(message.author.id, buyItem, buyAmount);
                    await methods.removemoney(message.author.id, itemPrice * (bmListingInfo ? 1 : buyAmount));
                    if(bmListingInfo) bm_methods.soldItem(bmListingInfo, message);
                    message.reply(lang.buy[3].replace('{0}', buyAmount).replace('{1}', isGame == false ? itemdata[buyItem].icon : '').replace('{2}', buyItem));
                }
                else if(!hasMoney){
                    message.reply(lang.buy[4]);
                }
                else{
                    message.reply(lang.errors[2]);
                }
            }
            else{
                // if user bought 3 rpgs at 5 tokens each, they would need 3 - 15 = -12 space in their inventory
                // if they had 20/10 slots at time of purchasing, this would return true because 20 - 12 = 8/10 slots
                const hasSpace = await methods.hasenoughspace(message.author.id, buyAmount - (buyAmount * itemPrice));
                const hasItems = await methods.hasitems(message.author.id, currency, (buyAmount * itemPrice));

                if(hasItems && hasSpace){
                    //they have enough of the currency and space, can buy item
                    methods.removeitem(message.author.id, currency, itemPrice * buyAmount);
                    methods.additem(message.author.id, buyItem, buyAmount);
                    message.reply(lang.buy[3].replace('{0}', buyAmount).replace('{1}', isGame == false ? itemdata[buyItem].icon : '').replace('{2}', buyItem));
                }
                else if(!hasItems){
                    //they dont have enough of the items(currency)
                    message.reply(lang.buy[5].replace('{0}', displayPrice));
                }
                else{
                    //no space
                    message.reply(lang.errors[2]);
                }
            }
        }
        else{
            botMessage.delete();
        }
    }
    catch(err){
        botMessage.delete();
        message.reply("You didn't react in time!");
    }
}
*/

async function boughtGame(app, user, game){
    app.query(`UPDATE gamesData SET gameAmount = gameAmount - 1 WHERE gameName = '${game.gameName}'`);

    try{
        const buyerEmbed = new app.Embed()
        .setTitle("✅ Game Purchased!")
        .setDescription("The moderators have received confirmation that you purchased a game and will respond with your key soon.")
        .setFooter('Please do not message asking "Where is my code?" unless atleast 12 hours have passed. We have the right to cancel this purchase if we suspect you of cheating.')
        .setTimestamp()

        let dm = await app.bot.getDMChannel(user.id)
        dm.createMessage(buyerEmbed);
    }
    catch(err){
        console.warn(require('util').inspect(err));
        // user has DM's disabled
    }

    const soldEmbed = new app.Embed()
    .setTitle('✅ Game Purchased')
    .addField('Game Sold', game.gameDisplay)
    .addField('Buyer', `${user.tag} ID: \`\`\`\n${user.id}\`\`\``)
    
    app.messager.messageMods(soldEmbed);
    console.warn('A game (' + game.gameName + ') was sold to id: ' + user.id);
}

async function getGamesData(app){
    const gameRows = await app.query(`SELECT * FROM gamesData`);
    let gameCount = 0;
    let gameData = {};
    for(let gameRow of gameRows){
        if(gameRow !== null){
            gameData[gameRow.gameName] = gameRow;
            gameCount += 1;
        }
    }
    if(gameCount == 0){
        return false;
    }
    else{
        return gameData;
    }
}
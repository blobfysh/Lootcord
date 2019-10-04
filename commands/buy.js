const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');
const config = require('../json/_config');
const shortid = require('shortid');
const bm_methods = require('../methods/black_market');

module.exports = {
    name: 'buy',
    aliases: ['purchase'],
    description: 'Purchase items and games with currency.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        methods.getGamesData().then(async gamesRow => {
            let buyItem = general.parseArgsWithSpaces(args[0], args[1], args[2]);
            let buyAmount = general.parseArgsWithSpaces(args[0], args[1], args[2], true, false, false);

            if(itemdata[buyItem] !== undefined){ // ITEM EXISTS
                let currency = itemdata[buyItem].buy.currency;
                let itemPrice = itemdata[buyItem].buy.amount;
                if(itemPrice == undefined){
                    message.reply(lang.buy[0]);
                }
                else{
                    if(buyAmount == undefined || !Number.isInteger(parseInt(buyAmount)) || buyAmount % 1 !== 0 || buyAmount < 1){
                        buyAmount = 1;
                    }
                    else if(buyAmount > 20) buyAmount = 20;
                    message.delete();

                    buyitem(message, buyItem, parseInt(buyAmount), itemPrice, currency, false, lang);
                }
            }
            else if(gamesRow[buyItem] !== undefined){
                // code for buying game here
                let gameAmount = gamesRow[buyItem].gameAmount;
                let currency = gamesRow[buyItem].gameCurrency;
                let itemPrice = gamesRow[buyItem].gamePrice;
                buyAmount = 1;

                if(gameAmount <= 0){
                    return message.reply("That game is sold out! 😞");
                }
                buyitem(message, buyItem, parseInt(buyAmount), itemPrice, currency, true, lang);
            }
            else if(shortid.isValid(buyItem) && await bm_methods.getListingInfo(buyItem)){
                let listInfo = await bm_methods.getListingInfo(buyItem);
                
                buyitem(message, listInfo.item, listInfo.amount, listInfo.price, 'money', false, lang, listInfo);
            }
            else{
                message.reply(lang.buy[1].replace('{0}', prefix));
            }
        });
    },
}

async function buyitem(message, buyItem, buyAmount, itemPrice, currency, isGame = false, lang, bmListingInfo = ''){
    let displayPrice = currency == 'money' ? methods.formatMoney(itemPrice * (bmListingInfo ? 1 : buyAmount)) : itemPrice * buyAmount + "x `" + currency + "`";

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
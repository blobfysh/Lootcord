const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const general   = require('../methods/general');
const itemdata  = require('../json/completeItemList.json');
const config    = require('../json/_config.json');
const shortid   = require('shortid');
const listing_fee = 0.10;

module.exports = {
    name: 'blackmarketlist',
    aliases: ['bmlist', 'bmsell'],
    description: 'Add a new listing to the Black Market.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let itemName = general.parseArgsWithSpaces(args[0], args[1], args[2]);
        let itemAmnt = general.getNum(general.parseArgsWithSpaces(args[0], args[1], args[2], true));
        let itemCost = general.getNum(general.parseArgsWithSpaces(args[0], args[1], args[2], false, false, false, {
            getMarketPrice: true,
            BMarg4: args[3]
        }), false, {ignoreNonNums: true});

        if(message.client.sets.tradeBannedUsers.has(message.author.id)){
            return message.reply("❌ You are trade banned.");
        }
        else if(validArgs(itemName, itemAmnt, itemCost)){
            // skip listing process...
            if(!await methods.hasitems(message.author.id, itemName, 1)){
                return message.reply('You don\'t have that item.');
            }
            else if(!itemdata[itemName].canBeStolen){
                return message.reply('That item cannot be sold on the market!');
            }
            else if(general.getNum(itemAmnt) >= 2147483647){
                return message.reply('Please enter a lower value.');
            }
            else if(!await methods.hasitems(message.author.id, itemName, general.getNum(itemAmnt))){
                return message.reply('You don\'t have enough of that item.'); 
            }
            else if(general.getNum(itemCost) >= 2147483647){
                return message.reply('Please enter a lower price o.o');
            }
            else if(general.getNum(itemCost) < 100){
                return message.reply('Please enter a higher price! Minimum $100');
            }
            else if(general.getNum(itemCost) <= (itemdata[itemName].sell * general.getNum(itemAmnt))){
                return message.reply('You can sell that to the bot for more money! You should list for more money, or sell them to the bot instead.');
            }
            const bmEmbed = new Discord.RichEmbed()
            .setTitle('List an item on the Black Market')
            .addField('Item:', itemName)
            .addField('Quantity:', itemAmnt)
            .addField('Price:', itemCost)
            .setColor(13215302)

            let listingFee = Math.floor(itemCost * listing_fee);
            let botMessage = await message.channel.send(message.author + ', This will cost ' + methods.formatMoney(listingFee) + ' ('+ listing_fee * 100 + '%) to list. Are you sure?', {embed: bmEmbed});

            await botMessage.react('✅');
            await botMessage.react('❌');
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            try{
                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    if(!await methods.hasmoney(message.author.id, listingFee)){
                        return botMessage.edit(`Listing failed! You can't afford the ${methods.formatMoney(listingFee)} fee.`, {embed: null});
                    }
                    else if(!await methods.hasitems(message.author.id, itemName, itemAmnt)){
                        return botMessage.edit(`Listing failed! You don't have **${itemAmnt}** \`${itemName}\`'s.`, {embed: null});
                    }
                    methods.removemoney(message.author.id, listingFee);
                    methods.removeitem(message.author.id, itemName, itemAmnt);

                    var listingId = await listItem(message, itemName, itemAmnt, itemCost);

                    return botMessage.edit(`Success! Your \`${itemName}\` was listed with the ID: \`${listingId}\`.`, {embed: null});
                }
                else{
                    botMessage.delete();
                }
            }
            catch(e){
            }
        }
        else{
            // step by step listing...
            let item, amount, price;

            const bmEmbed = new Discord.RichEmbed()
            .setTitle('List an item on the Black Market')
            .setDescription('Enter the name of the item you would like to list:')
            .setFooter('Type cancel to stop the command.')
            .setColor(13215302)
            let botMessage = await message.channel.send(message.author, {embed: bmEmbed});
        
            const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id, { time: 60000 });
        
            collector.on('collect', async response => {
                let newArgs = response.content.split(/ +/);
                let itemName = general.parseArgsWithSpaces(newArgs[0], newArgs[1], newArgs[2], false, false);

                if(response.content.toLowerCase() == 'cancel' || response.content.toLowerCase() == 'stop'){
                    collector.stop('stopped');
                }
                else if(itemdata[itemName] && !item){
                    if(!await methods.hasitems(message.author.id, itemName, 1)){
                        return response.reply('You don\'t have that item.');
                    }
                    else if(!itemdata[itemName].canBeStolen){
                        return response.reply('That item cannot be sold on the market!');
                    }
                    item = itemName;
                    bmEmbed.addField('Item:', item, true);
                    bmEmbed.setDescription('Enter the amount to sell:')
                    botMessage = await message.channel.send(message.author, {embed: bmEmbed});
                }
                else if(!item){
                    response.reply('I don\'t recognize that item.');
                }
                else if(general.isNum(response.content) && !amount){
                    if(general.getNum(response.content) >= 2147483647){
                        return response.reply('Please enter a lower value.');
                    }
                    else if(!await methods.hasitems(message.author.id, item, general.getNum(response.content))){
                        return response.reply('You don\'t have enough of that item.'); 
                    }
                    amount = general.getNum(response.content);
                    bmEmbed.addField('Quantity:', amount, true);
                    bmEmbed.setDescription('Enter the price for all **' + amount + '**:')
                    botMessage = await message.channel.send(message.author, {embed: bmEmbed});
                }
                else if(!amount){
                    response.reply('Please enter a valid amount.');
                }
                else if(general.isNum(response.content) && !price){
                    if(general.getNum(response.content) >= 2147483647){
                        return response.reply('Please enter a lower value.');
                    }
                    else if(general.getNum(response.content) < 100){
                        return response.reply('Please enter a higher price! Minimum $100');
                    }
                    else if(general.getNum(response.content) <= (itemdata[item].sell * amount)){
                        return response.reply('You can sell that to the bot for more money! You should list for more money, or sell them to the bot instead.');
                    }
                    price = general.getNum(response.content);
                    listingFee = Math.floor(price * listing_fee);
                    bmEmbed.addField('Price:', methods.formatMoney(price));
                    bmEmbed.setDescription(`List **${amount}x** \`${item}\` for ${methods.formatMoney(price)}?`);
                    botMessage = await message.channel.send(message.author + ', This will cost ' + methods.formatMoney(listingFee) + ' to list. Are you sure?', {embed: bmEmbed});
                    collector.stop('finished');

                    await botMessage.react('✅');
                    await botMessage.react('❌');
                    const filter = (reaction, user) => {
                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };

                    try{
                        const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
                        const reaction = collected.first();

                        if(reaction.emoji.name === '✅'){
                            if(!await methods.hasmoney(message.author.id, listingFee)){
                                return botMessage.edit(`Listing failed! You can't afford the ${methods.formatMoney(listingFee)} fee.`, {embed: null});
                            }
                            else if(!await methods.hasitems(message.author.id, item, amount)){
                                return botMessage.edit(`Listing failed! You don't have **${amount}** \`${item}\`'s.`, {embed: null});
                            }
                            methods.removemoney(message.author.id, listingFee);
                            methods.removeitem(message.author.id, item, amount);

                            var listingId = await listItem(message, item, amount, price);

                            return botMessage.edit(`Success! Your \`${item}\` was listed with the ID: \`${listingId}\`.`, {embed: null});
                        }
                        else{
                            botMessage.delete();
                        }
                    }
                    catch(e){
                    }
                }
            });
            collector.on('end', async (response, reason) => {
                if(reason == 'time'){
                    bmEmbed.setFooter('COMMAND TIMED OUT');
                    botMessage.edit({embed: bmEmbed})
                }
                else if(reason == 'stopped'){
                    bmEmbed.setFooter('Cancelled');
                    botMessage.edit({embed: bmEmbed})
                }
            });
        }
    },
}

function validArgs(item, amount, listPrice){
    if(itemdata[item] == undefined){
        console.log('204');
        return false;
    }
    else if(!general.isNum(amount)){
        console.log('208');
        return false;
    }
    else if(!general.isNum(listPrice)){
        console.log('212');
        return false;
    }
    else{
        return true;
    }
}

async function listItem(message, item, amount, price){
    var listId = shortid.generate();
    var pricePer = Math.floor(price / amount);

    const BMrow = await query(insertBMSQL, [
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
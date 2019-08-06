const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'sellall',
    aliases: [''],
    description: 'Sell multiple items at once.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const itemRow = await general.getItemObject(message.author.id);
        let sellItem = args[0];

        if(sellItem !== undefined){
            sellItem = sellItem.toLowerCase();
            let itemType = "";
            let commonTotal = 0;
            let totalAmount = 0;
            //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
            let itemsToCheck = methods.getitems(sellItem.charAt(0).toUpperCase() + sellItem.slice(1), {excludeType: 'banner'});

            if(itemsToCheck.length < 1 || sellItem.toLowerCase() == 'all'){
                return message.reply(lang.sellall[3].replace('{0}', prefix));
            }
            else{
                //iterate array and sell
                for (var i = 0; i < itemsToCheck.length; i++) {
                    if(itemRow[itemsToCheck[i]] >= 1){
                        totalAmount += itemRow[itemsToCheck[i]];
                        commonTotal += (itemRow[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                    }
                }
            }
            if(totalAmount <= 0){
                return message.reply(lang.sellall[1]);
            }

            const botMessage = await message.reply(lang.sellall[0].replace('{0}', totalAmount).replace('{1}', sellItem).replace('{2}', methods.formatMoney(commonTotal)));
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
                    const itemRow2 = await general.getItemObject(message.author.id);

                    let testAmount = 0; // used to verify user didnt alter inventory while selling.
                    let testTotalItems = 0;
                    for (var i = 0; i < itemsToCheck.length; i++) {
                        if(itemRow2[itemsToCheck[i]] >= 1){
                            testTotalItems += itemRow2[itemsToCheck[i]];
                            testAmount += (itemRow2[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    
                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                        //VERIFIED
                        methods.addmoney(message.author.id, parseInt(commonTotal));
                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow2[itemsToCheck[i]] !== undefined) methods.removeitem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]]);
                        }

                        message.reply(lang.sellall[4].replace('{0}', sellItem));
                    }
                    else{
                        message.reply(lang.sellall[2]);
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.delete();
                message.reply(lang.errors[3]);
            }
        }
        else{
            let commonTotal = 0;
            let totalAmount = 0;
            let itemsToCheck = methods.getitems("all", {exclude: "limited", excludeType: 'banner'});

            for (var i = 0; i < itemsToCheck.length; i++) {
                if(itemRow[itemsToCheck[i]] >= 1){
                    totalAmount += itemRow[itemsToCheck[i]];
                    commonTotal += (itemRow[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                }
            }
            if(totalAmount <= 0){
                return message.reply(lang.sellall[1]);
            }

            const botMessage = await message.reply(lang.sellall[6].replace('{0}', totalAmount).replace('{1}', methods.formatMoney(commonTotal)));
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
                    const itemRow2 = await general.getItemObject(message.author.id);

                    let testAmount = 0;
                    let testTotalItems = 0;
                    for (var i = 0; i < itemsToCheck.length; i++) {
                        if(itemRow2[itemsToCheck[i]] >= 1){
                            testTotalItems += itemRow2[itemsToCheck[i]];
                            testAmount += (itemRow2[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    
                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                        methods.addmoney(message.author.id, parseInt(commonTotal));
                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow2[itemsToCheck[i]] !== undefined) methods.removeitem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]]);
                        }

                        message.reply(lang.sellall[5]);
                    }
                    else{
                        message.reply(lang.sellall[2]);
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.delete();
                message.reply(lang.errors[3]);
            }
        }
    },
}
const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'sellall',
    aliases: [''],
    description: 'Sell multiple items at once.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(oldRow => {
            const itemRow = oldRow[0];
            let sellItem = args[0];

            if(sellItem !== undefined){
                sellItem = sellItem.toLowerCase();
                let itemType = "";
                let commonTotal = 0;
                let totalAmount = 0;
                //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                let itemsToCheck = methods.getitems(sellItem.charAt(0).toUpperCase() + sellItem.slice(1), {});

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
                message.delete();
                message.reply(lang.sellall[0].replace('{0}', totalAmount).replace('{1}', sellItem).replace('{2}', methods.formatMoney(commonTotal))).then(async reactMsg => {
                    await reactMsg.react('✅');
                    await reactMsg.react('❌');
                    return reactMsg;
                }).then(botMessage => {
                    const filter = (reaction, user) => {
                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();

                        if(reaction.emoji.name === '✅'){
                            botMessage.delete();
                            query(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(oldRow2 => {
                                const itemRow2 = oldRow2[0];

                                let testAmount = 0;//used to verify user didnt alter inventory while selling.
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
                                        query(`UPDATE items SET ${itemsToCheck[i]} = ${0} WHERE userId = ${message.author.id}`);
                                    }

                                    message.reply(lang.sellall[4].replace('{0}', sellItem));
                                }
                                else{
                                    message.reply(lang.sellall[2]);
                                }
                            });
                        }
                        else{
                            botMessage.delete();
                        }
                    }).catch(collected => {
                        botMessage.delete();
                        message.reply(lang.errors[3]);
                    });
                });
            }
            else{
                let commonTotal = 0;
                let totalAmount = 0;
                //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                let itemsToCheck = methods.getitems("all", {exclude: "limited"});

                for (var i = 0; i < itemsToCheck.length; i++) {
                    if(itemRow[itemsToCheck[i]] >= 1){
                        totalAmount += itemRow[itemsToCheck[i]];
                        commonTotal += (itemRow[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                    }
                }
                if(totalAmount <= 0){
                    return message.reply(lang.sellall[1]);
                }

                message.reply(lang.sellall[6].replace('{0}', totalAmount).replace('{1}', methods.formatMoney(commonTotal))).then(botMessage => {
                    botMessage.react('✅').then(() => botMessage.react('❌'));
                    const filter = (reaction, user) => {
                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(collected => {
                        const reaction = collected.first();

                        if(reaction.emoji.name === '✅'){
                            botMessage.delete();
                            query(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(oldRow2 => {
                                const itemRow2 = oldRow2[0];

                                let testAmount = 0;//used to verify user didnt alter inventory while selling.
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
                                        query(`UPDATE items SET ${itemsToCheck[i]} = ${0} WHERE userId = ${message.author.id}`);
                                    }

                                    message.reply(lang.sellall[5]);
                                }
                                else{
                                    message.reply(lang.sellall[2]);
                                }
                            });
                        }
                        else{
                            botMessage.delete();
                        }
                    }).catch(collected => {
                        botMessage.delete();
                        message.reply("You didn't react in time!");
                    });
                });
            }
        });
    },
}
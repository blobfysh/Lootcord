const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'sell',
    aliases: [''],
    description: 'Sell items for money.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let sellItem = methods.getCorrectedItemInfo(args[0]);
        let sellAmount = args[1];

        if(itemdata[sellItem] !== undefined){
            let itemPrice = itemdata[sellItem].sell;
            
            if(itemPrice !== ""){
                if(sellAmount == undefined || !Number.isInteger(parseInt(sellAmount)) || sellAmount % 1 !== 0 || sellAmount < 1){
                    sellAmount = 1;
                }
                else if(sellAmount > 30){
                    sellAmount = 30;
                }
                message.delete();
                message.reply(lang.sell[0].replace('{0}', sellAmount).replace('{1}', sellItem).replace('{2}', methods.formatMoney(itemPrice * sellAmount))).then(botMessage => {
                    botMessage.react('✅').then(() => botMessage.react('❌'));
                    const filter = (reaction, user) => {
                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();

                        if(reaction.emoji.name === '✅'){
                            botMessage.delete();
                            methods.hasitems(message.author.id, sellItem, sellAmount).then(hasitem => {
                                if(hasitem){
                                    methods.addmoney(message.author.id, parseInt(itemPrice * sellAmount));
                                    methods.removeitem(message.author.id, sellItem, sellAmount);
                                    message.reply(lang.sell[1].replace('{0}', sellAmount).replace('{1}', sellItem).replace('{2}', methods.formatMoney(itemPrice * sellAmount)));
                                }
                                else{
                                    message.reply(lang.sell[2]);
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
                message.reply(lang.sell[3]);
            }
        }
        else if(sellItem.startsWith("common") || sellItem.startsWith("uncommon") || sellItem.startsWith("rare") || sellItem.startsWith("epic") || sellItem.startsWith("legendary")){
            message.reply(lang.sell[5].replace('{0}', prefix));
            return;
        }
        else{
            message.reply(lang.sell[4].replace('{0}', prefix));
        }
    },
}
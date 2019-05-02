const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

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
        methods.getGamesData().then(gamesRow => {
            let buyItem = methods.getCorrectedItemInfo(args[0]);
            let buyAmount = args[1];

            if(itemdata[buyItem] !== undefined){//ITEM EXISTS
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

                    methods.buyitem(message, buyItem, parseInt(buyAmount), itemPrice, currency, false, lang);
                }
            }
            else if(gamesRow[buyItem] !== undefined){
                //code for buying game here
                let gameAmount = gamesRow[buyItem].gameAmount;
                let currency = gamesRow[buyItem].gameCurrency;
                let itemPrice = gamesRow[buyItem].gamePrice;
                buyAmount = 1;

                if(gameAmount <= 0){
                    return message.reply("That game is sold out! 😞");
                }
                methods.buyitem(message, buyItem, parseInt(buyAmount), itemPrice, currency, true, lang);
            }
            else{
                message.reply(lang.buy[1].replace('{0}', prefix));
            }
        });
    },
}
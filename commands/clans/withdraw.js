const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');

module.exports = {
    name: 'withdraw',
    aliases: ['take'],
    description: 'Withdraw items from your clans vault.',
    minimumRank: 1,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        let itemName = methods.getCorrectedItemInfo(args[0]);
        let itemAmnt = args[1];

        if(itemName !== 'money' && itemdata[itemName] == undefined && Number.isInteger(parseInt(itemName))){
            itemAmnt = itemName;
            itemName = 'money';
        }

        if(!args.length){
            return message.reply('You are not a member of any clan! You can look up other clans by searching their name.');
        }
        else if(itemName !== 'money' && itemdata[itemName] == undefined){
            return message.reply('I don\'t recognize that item.');
        }
        else{
            if(itemAmnt == undefined || !Number.isInteger(parseInt(itemAmnt)) || itemAmnt % 1 !== 0){
                itemAmnt = 1;
            }
            else if(itemAmnt < 1){
                return message.reply('Error trying to deposit. Try again? 😟');
            }
            
            if(itemName == 'money'){
                const hasMoney = await clans.hasMoney(scoreRow.clanId, itemAmnt);

                if(!hasMoney) return message.reply('The clan does not have that much in the bank!');

                clans.removeMoney(scoreRow.clanId, itemAmnt);
                methods.addmoney(message.author.id, itemAmnt);
            }
            else{
                const hasItems = await methods.hasitems(scoreRow.clanId, itemName, itemAmnt);

                if(!hasItems) return message.reply('The clan does not have enough of that item in the vault.');

                methods.removeitem(scoreRow.clanId, itemName, itemAmnt);
                methods.additem(message.author.id, itemName, itemAmnt);
            }
        }
    },
}
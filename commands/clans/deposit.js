const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');

module.exports = {
    name: 'deposit',
    aliases: ['put'],
    description: 'Deposit items into your clans vault.',
    minimumRank: 0,
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
            else if(itemName !== 'money' && !itemdata[itemName].canBeStolen){
                return message.reply(lang.trade.errors[6]);
            }
            else if(itemName !== 'money' && !(await clans.hasPower(scoreRow.clanId, itemAmnt))){
                return message.reply('Theres not enough power available in the clan!');
            }
            
            if(itemName == 'money'){
                const hasMoney = await methods.hasmoney(message.author.id, itemAmnt);

                if(!hasMoney) return message.reply('You dont have enough money');

                methods.removemoney(message.author.id, itemAmnt);
                depositItem(itemName, itemAmnt, scoreRow.clanId);
            }
            else{
                const hasItems = await methods.hasitems(message.author.id, itemName, itemAmnt);

                if(!hasItems) return message.reply('You dont have enough of that item.');

                methods.removeitem(message.author.id, itemName, itemAmnt);
                depositItem(itemName, itemAmnt, scoreRow.clanId);
            }
        }
    },
}

async function depositItem(item, amount, clanId){
    if(item == 'money'){
        query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`);
    }
    else{
        query(`UPDATE items SET ${item} = ${item} + ${parseInt(amount)} WHERE userId = ${clanId}`);
    }
}
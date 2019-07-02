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
            return message.reply(lang.clans.leave[0]);
        }
        else if(itemName !== 'money' && itemdata[itemName] == undefined){
            return message.reply(lang.clans.deposit[0]);
        }
        else{
            if(itemAmnt == undefined || !Number.isInteger(parseInt(itemAmnt)) || itemAmnt % 1 !== 0){
                itemAmnt = 1;
            }
            else if(itemAmnt < 1){
                return message.reply(lang.clans.deposit[1]);
            }
            
            if(itemName !== 'money' && !itemdata[itemName].canBeStolen){
                return message.reply(lang.clans.deposit[3].replace('{0}', itemName));
            }
            else if(itemName !== 'money' && !(await clans.hasPower(scoreRow.clanId, itemAmnt))){
                const clanPow = await clans.getClanData(scoreRow.clanId);
                return message.reply(lang.clans.deposit[2].replace('{0}', clanPow.usedPower).replace('{1}', clanPow.currPower));
            }
            
            if(itemName == 'money'){
                const hasMoney = await methods.hasmoney(message.author.id, itemAmnt);

                if(!hasMoney) return message.reply(lang.buy[4]);

                await methods.removemoney(message.author.id, itemAmnt);
                await depositItem(itemName, itemAmnt, scoreRow.clanId);

                message.reply(lang.clans.deposit[5].replace('{0}', methods.formatMoney(itemAmnt)).replace('{1}',
                    methods.formatMoney((await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0][itemName])
                ));
            }
            else{
                const hasItems = await methods.hasitems(message.author.id, itemName, itemAmnt);
                if(!hasItems) return message.reply(lang.sell[2]);

                await methods.removeitem(message.author.id, itemName, itemAmnt);
                await depositItem(itemName, itemAmnt, scoreRow.clanId);

                message.reply(lang.clans.deposit[4].replace('{0}', itemAmnt).replace('{1}', itemName).replace('{2}', 
                    (await query(`SELECT * FROM items WHERE userId = ${scoreRow.clanId}`))[0][itemName]
                ).replace('{3}', itemName).replace('{4}', 
                    (await clans.getClanData(scoreRow.clanId)).usedPower + '/' + (await clans.getClanData(scoreRow.clanId)).currPower
                ));
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
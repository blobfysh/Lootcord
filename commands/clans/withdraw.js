const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');
const general = require('../../methods/general');

module.exports = {
    name: 'withdraw',
    aliases: ['take'],
    description: 'Withdraw items from your clans vault.',
    minimumRank: 2,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        let itemName = general.parseArgsWithSpaces(args[0], args[1], args[2]);
        let itemAmnt = general.parseArgsWithSpaces(args[0], args[1], args[2], true, false, false, {clanDeposit: true});

        if(itemName !== 'money' && itemdata[itemName] == undefined && Number.isInteger(parseInt(itemName))){
            itemAmnt = itemName;
            itemName = 'money';
        }

        if(!args.length){
            return message.reply(lang.clans.withdraw[5]);
        }
        else if(itemName !== 'money' && itemdata[itemName] == undefined){
            return message.reply(lang.clans.deposit[0]);
        }
        else if(message.client.sets.gettingRaided.has(scoreRow.clanId.toString())){
            return message.reply(lang.clans.withdraw[4]);
        }
        else{
            if(itemAmnt == undefined || !Number.isInteger(parseInt(itemAmnt)) || itemAmnt % 1 !== 0){
                itemAmnt = 1;
            }
            else if(itemAmnt < 1){
                return message.reply(lang.clans.deposit[1]);
            }
            
            if(itemName == 'money'){
                const hasMoney = await clans.hasMoney(scoreRow.clanId, itemAmnt);

                if(!hasMoney) return message.reply(lang.clans.withdraw[0].replace('{0}', methods.formatMoney(
                    (await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0].money
                )));

                await clans.removeMoney(scoreRow.clanId, itemAmnt);
                await methods.addmoney(message.author.id, itemAmnt);
                
                clans.addLog(scoreRow.clanId, `${message.author.tag} withdrew $${itemAmnt}`);

                message.reply(lang.clans.withdraw[3].replace('{0}', methods.formatMoney(itemAmnt)).replace('{1}',
                    methods.formatMoney((await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0][itemName])
                ));
            }
            else{
                const hasItems = await methods.hasitems(scoreRow.clanId, itemName, itemAmnt);
                const clanItems = await general.getItemObject(scoreRow.clanId);

                if(!hasItems) return message.reply(lang.clans.withdraw[1].replace('{0}',
                    clanItems[itemName] !== undefined ? clanItems[itemName] : 0
                ).replace('{1}', itemName));

                const hasSpace = await methods.hasenoughspace(message.author.id, itemAmnt);
                if(!hasSpace) return message.reply(lang.errors[2]);

                await methods.removeitem(scoreRow.clanId, itemName, itemAmnt);
                await methods.additem(message.author.id, itemName, itemAmnt);

                

                message.reply(lang.clans.withdraw[2].replace('{0}', itemAmnt).replace('{1}', itemName).replace('{2}', 
                    clanItems[itemName] - itemAmnt
                ).replace('{3}', itemName).replace('{4}', 
                    (await clans.getClanData(scoreRow.clanId)).usedPower + '/' + (await clans.getClanData(scoreRow.clanId)).currPower
                ));
            }
        }
    },
}
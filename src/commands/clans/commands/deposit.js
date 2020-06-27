const MAX_BANK_STORAGE = 10000000;

module.exports = {
    name: 'deposit',
    aliases: ['put'],
    description: 'Deposit items into your clans vault.',
    long: 'Deposit items into your clans vault.',
    args: {"item/money": "Item to deposit or money to deposit.", "amount": "Amount of item or money to deposit."},
    examples: ["clan deposit rpg 1", "clan deposit 3000"],
    requiresClan: true,
    requiresActive: true,
    minimumRank: 1,
    levelReq: 3,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        let itemName = app.parse.items(args)[0];
        let itemAmnt = app.parse.numbers(args)[0];
        let isMoney = false;
        if(!itemName && itemAmnt) isMoney = true;

        else if(!itemName && !itemAmnt && args[0] && args[0].toLowerCase() === 'all'){
            isMoney = true;
            itemAmnt = scoreRow.money;
        }


        if(await app.cd.getCD(message.author.id, 'tradeban')){
            return message.reply("❌ You are trade banned.");
        }
        else if(!itemName && !itemAmnt){
            return message.reply('You need to specify an item or money to deposit into the clan! `clan deposit <item/money> <amount>`');
        }

        if(isMoney){
            const clanRow = (await app.query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0];

            if(!await app.player.hasMoney(message.author.id, itemAmnt)){
                return message.reply(`❌ You don't have that much money! You currently have ${app.common.formatNumber(scoreRow.money)}`);
            }
            else if(clanRow.money + itemAmnt > MAX_BANK_STORAGE){
                return message.reply(`Your clan bank is packed! Cannot store more than ${app.common.formatNumber(MAX_BANK_STORAGE)} in bank.`)
            }

            await app.player.removeMoney(message.author.id, itemAmnt);
            await depositItem(app, 'money', itemAmnt, scoreRow.clanId);

            app.clans.addLog(scoreRow.clanId, `${(message.author.username + '#' + message.author.discriminator)} deposited ${app.common.formatNumber(itemAmnt, true)}`);

            return message.reply(`Deposited **${app.common.formatNumber(itemAmnt)}**\n\nThe clan bank now has **${app.common.formatNumber(clanRow.money + itemAmnt)}**`);
        }

        // check for items
        itemAmnt = itemAmnt || 1;

        if(!itemName){
            return message.reply("❌ I don't recognize that item.");
        }
        else if(!app.itemdata[itemName].canBeStolen){
            return message.reply(`\`${itemName}\`'s are bound to the player, meaning you can't trade them or put them in the clan vault.`);
        }
        else if(!(await app.clans.hasPower(scoreRow.clanId, itemAmnt))){
            const clanPow = await app.clans.getClanData(scoreRow.clanId);
            return message.reply(`Theres not enough power available in the clan! Your vault is currently using **${clanPow.usedPower}** power and only has **${clanPow.currPower}** current power.`);
        }

        const userItems = await app.itm.getItemObject(message.author.id);
        const hasItems = await app.itm.hasItems(userItems, itemName, itemAmnt);
        
        if(!hasItems) return message.reply(`❌ You don't have enough of that item! You have **${userItems[itemName] || 0}x** ${app.itemdata[itemName].icon}\`${itemName}\``);

        await app.itm.removeItem(message.author.id, itemName, itemAmnt);
        await depositItem(app, itemName, itemAmnt, scoreRow.clanId);

        app.clans.addLog(scoreRow.clanId, `${(message.author.username + '#' + message.author.discriminator)} deposited ${itemAmnt}x ${itemName}`);

        const clanItems = await app.itm.getItemObject(scoreRow.clanId);
        const clanPow = await app.clans.getClanData(scoreRow.clanId);

        message.reply(`Deposited ${itemAmnt}x ${app.itemdata[itemName].icon}\`${itemName}\` to your clan vault.\n\nThe vault now has **${clanItems[itemName]}x** ${app.itemdata[itemName].icon}\`${itemName}\` and is using **${clanPow.usedPower + '/' + clanPow.currPower}** power.`);
    },
}

async function depositItem(app, item, amount, clanId){
    if(item === 'money'){
        await app.query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`);
    }
    else{
        await app.itm.addItem(clanId, item, parseInt(amount));
    }
}
const MAX_DISPARITY = 2; // number of times greater one persons value can be over the others

module.exports = {
    name: 'trade',
    aliases: [''],
    description: 'Trade items and money with another player.',
    long: '**A players value cannot be 2x greater than the other players value.**\nLvl Required: 3+\nStart a trade with another user. Trade commands include:\n\n`add <item> <amount>` - Item to add to trade\n`remove <item>` - Remove item from trade\n`addmoney <amount>` - Amount of money to add\n`accept`\n`cancel`',
    args: {"@user": "User to trade with."},
    examples: ["trade @blobfysh"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    levelReq: 3,

    async execute(app, message){
        let user = app.parse.members(message, message.args)[0];
        //var userNameID = general.getUserId(args);

        if(!user){
            return message.reply('❌ You need to mention the user you want to trade with.');
        }

        const victimRow = await app.player.getRow(user.id);

        if(user.id === app.bot.user.id){
            return message.reply('I respectfully DECLINE');
        }
        else if(user.id === message.author.id){
            return message.reply(`❌ You can't trade with yourself.`);
        }
        else if(!victimRow){
            return message.reply(`❌ The person you're trying to trade with doesn't have an account.`);
        }
        else if(await app.cd.getCD(message.author.id, 'tradeban')){
            return message.reply("❌ You are trade banned.");
        }
        else if(await app.cd.getCD(user.id, 'tradeban')){
            return message.reply("❌ User is trade banned.");
        }
        else if(await app.cd.getCD(user.id, 'banned')){
            return message.reply("❌ User is banned.");
        }
        else if(!await app.player.isActive(user.id, message.guild.id)){
            return message.reply(`❌ User has not activated their account in this server.`);
        }
        else if(victimRow.level < this.levelReq){
            return message.reply('❌ Target player must be atleast level 3.');
        }
        else if(await app.cd.getCD(user.id, 'peck')){
            return message.reply(`That person is under the effects of ${app.itemdata['peck_seed'].icon}\`peck_seed\``);
        }

        const botMessage = await message.channel.createMessage(`<@${user.id}>, **${message.member.effectiveName}** would like to trade with you!`);
        
        try{
            const confirmed = await app.react.getConfirmation(user.id, botMessage);

            if(confirmed){
                
                try{
                    // try to create collector first so that it can error out
                    app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => {
                        return m.author.id === message.author.id
                    }, { time: 180000 });
                    app.msgCollector.createUserCollector(user.id, message.channel.id, m => {
                        return m.author.id === user.id
                    }, { time: 180000 });
                }
                catch(err){
                    return botMessage.edit('❌ One of the trading partners has another command active. Finish using that command before starting a trade.');
                }

                const player1Collector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;
                const player2Collector = app.msgCollector.collectors[`${user.id}_${message.channel.id}`].collector;

                let player1Money = 0;
                let player2Money = 0;
                let player1Items = [];
                let player2Items = [];

                player1Collector.on('collect', getPlayer);
                player2Collector.on('collect', getPlayer);
                
                player1Collector.on('end', reason => {
                    if(reason === 'time'){
                        message.channel.createMessage('❌ The trade timed out.');
                    }
                })

                function getPlayer(m){
                    if(!m.content.toLowerCase().startsWith(message.prefix)) return;

                    let args = m.content.slice(message.prefix.length).split(/ +/);

                    if(m.author.id === user.id) return handleMsg(m, args.slice(1), args[0] || '', 2);
                    
                    return handleMsg(m, args.slice(1), args[0] || '', 1);
                }

                async function handleMsg(m, args, command, player){
                    if(command.toLowerCase() === 'cancel'){
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                        app.msgCollector.stopCollector(`${user.id}_${message.channel.id}`);

                        message.channel.createMessage('Trade has been cancelled.');
                    }
                    else if(command.toLowerCase() === 'accept'){
                        if(!getValue(app, player2Money, player2Items) && !getValue(app, player1Money, player1Items)) return m.channel.createMessage(`❌ You should add something to the trade!`);
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                        app.msgCollector.stopCollector(`${user.id}_${message.channel.id}`);

                        if(player === 1){
                            const botMessage = await message.channel.createMessage(`<@${user.id}>, **${message.member.effectiveName}** has accepted the trade! Do you accept?`);

                            try{
                                const accepted = await app.react.getConfirmation(user.id, botMessage);

                                if(accepted){
                                    try{
                                        let player1val = getValue(app, player1Money, player1Items);
                                        let player2val = getValue(app, player2Money, player2Items);

                                        if(player1val > player2val * MAX_DISPARITY){
                                            return botMessage.edit(`❌ Cannot complete trade. **${message.member.effectiveName}**'s offer (${app.common.formatNumber(player1val)}) was ${MAX_DISPARITY}x greater than **${user.effectiveName}**'s offer (${app.common.formatNumber(player2val)}).`)
                                        }
                                        else if(player2val > player1val * MAX_DISPARITY){
                                            return botMessage.edit(`❌ Cannot complete trade. **${user.effectiveName}**'s offer (${app.common.formatNumber(player2val)}) was ${MAX_DISPARITY}x greater than **${message.member.effectiveName}**'s offer (${app.common.formatNumber(player1val)}).`)
                                        }

                                        await tradeItems(app, message.member, player1Money, player1Items, user, player2Money, player2Items);
                                        
                                        botMessage.edit('✅ Trade completed!');

                                        tradeCompleted(app, refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, message.prefix, true), message.member, user);
                                    }
                                    catch(err){
                                        if(err.player){
                                            botMessage.edit(`❌ **${err.player.effectiveName}** ${err.msg}`);
                                        }
                                    }
                                    
                                }
                                else{
                                    botMessage.edit(`❌ **${user.effectiveName}** declined the trade.`);
                                }
                            }
                            catch(err){
                                botMessage.edit(`❌ **${user.effectiveName}** did not respond.`);
                            }
                        }
                        else if(player === 2){
                            const botMessage = await message.channel.createMessage(`<@${message.author.id}>, **${user.effectiveName}** has accepted the trade! Do you accept?`);

                            try{
                                const accepted = await app.react.getConfirmation(message.author.id, botMessage);

                                if(accepted){
                                    try{
                                        let player1val = getValue(app, player1Money, player1Items);
                                        let player2val = getValue(app, player2Money, player2Items);

                                        if(player1val > player2val * MAX_DISPARITY){
                                            return botMessage.edit(`❌ Cannot complete trade. **${message.member.effectiveName}**'s offer (${app.common.formatNumber(player1val)}) was ${MAX_DISPARITY}x greater than **${user.effectiveName}**'s offer (${app.common.formatNumber(player2val)}).`)
                                        }
                                        else if(player2val > player1val * MAX_DISPARITY){
                                            return botMessage.edit(`❌ Cannot complete trade. **${user.effectiveName}**'s offer (${app.common.formatNumber(player2val)}) was ${MAX_DISPARITY}x greater than **${message.member.effectiveName}**'s offer (${app.common.formatNumber(player1val)}).`)
                                        }

                                        await tradeItems(app, message.member, player1Money, player1Items, user, player2Money, player2Items);

                                        botMessage.edit('✅ Trade completed!');

                                        tradeCompleted(app, refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, message.prefix, true), message.member, user);
                                    }
                                    catch(err){
                                        if(err.player){
                                            botMessage.edit(`❌ **${err.player.effectiveName}** ${err.msg}`);
                                        }
                                    }
                                }
                                else{
                                    botMessage.edit(`❌ **${message.member.effectiveName}** declined the trade.`);
                                }
                            }
                            catch(err){
                                botMessage.edit(`❌ **${message.member.effectiveName}** did not respond.`);
                            }
                        }
                    }
                    else if(command.toLowerCase() === 'addmoney'){
                        let amount = app.parse.numbers(args)[0];

                        if(!await app.player.hasMoney(m.author.id, amount)){
                            return m.channel.createMessage(`❌ You don't have that much money.`);
                        }

                        if(player === 1){
                            player1Money += amount;
                        }
                        else if(player === 2){
                            player2Money += amount;
                        }

                        message.channel.createMessage(refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, message.prefix));
                    }
                    else if(command.toLowerCase() === 'add'){
                        let amount = app.parse.numbers(args)[0] || 1;
                        let item = app.parse.items(args)[0];

                        if(!item){
                            return m.channel.createMessage('❌ You need to specify an item.');
                        }
                        if(!app.itemdata[item].canBeStolen){
                            return m.channel.createMessage('❌ That item cannot be traded.');
                        }

                        if(player === 1){
                            if(listHasItem(player1Items, item)){
                                return m.channel.createMessage('❌ That item is already in the trade.');
                            }
                            if(!await app.itm.hasItems(m.author.id, item, amount)){
                                return m.channel.createMessage('❌ You don\'t have enough of that item.');
                            }

                            player1Items.push(item+"|"+amount);
                        }
                        else if(player === 2){
                            if(listHasItem(player2Items, item)){
                                return m.channel.createMessage('❌ That item is already in the trade.');
                            }
                            if(!await app.itm.hasItems(m.author.id, item, amount)){
                                return m.channel.createMessage('❌ You don\'t have enough of that item.');
                            }

                            player2Items.push(item+"|"+amount);
                        }

                        message.channel.createMessage(refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, message.prefix));
                    }
                    else if(command.toLowerCase() === 'remove'){
                        let item = app.parse.items(args)[0];

                        if(!item){
                            return m.channel.createMessage('❌ You need to specify an item.');
                        }

                        if(player === 1){
                            if(!listHasItem(player1Items, item)){
                                return m.channel.createMessage('❌ You don\'t have that item in the trade.');
                            }

                            for(let i = 0; i < player1Items.length; i++){
                                if(player1Items[i].split('|')[0] === item){
                                    player1Items.splice(i, 1);
                                }
                            }

                            m.channel.createMessage(`Item ${app.itemdata[item].icon}\`${item}\` removed.`);
                        }
                        else if(player === 2){
                            if(!listHasItem(player2Items, item)){
                                return m.channel.createMessage('❌ You don\'t have that item in the trade.');
                            }

                            for(let i = 0; i < player2Items.length; i++){
                                if(player2Items[i].split('|')[0] === item){
                                    player2Items.splice(i, 1);
                                }
                            }

                            m.channel.createMessage(`Item ${app.itemdata[item].icon}\`${item}\` removed.`);
                        }

                        message.channel.createMessage(refreshWindow(app, message.member, player1Money, player1Items, user, player2Money, player2Items, message.prefix));
                    }
                }

                message.channel.createMessage(refreshWindow(app, message.member, 0, [], user, 0, [], message.prefix));
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit(`❌ **${user.effectiveName}** did not respond.`);
        }
    },
}

function refreshWindow(app, player1Member, player1Money, player1Items, player2Member, player2Money, player2Items, prefix, log = false){
    const tradeWindow = new app.Embed()
    .setTitle("Trade Window")
    .setColor(2713128)
    .setDescription(player1Member.effectiveName + '\'s offer may not exceed **' + MAX_DISPARITY + 'x** the value of ' + player2Member.effectiveName + '\'s offer, and vice versa.')
    //.setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/568469679081914435/tradeIcon.png")
    .addField(log ? player1Member.username : player1Member.effectiveName + `'s Offer`, app.common.formatNumber(player1Money),true)
    .addField(log ? player2Member.username : player2Member.effectiveName + `'s Offer`, app.common.formatNumber(player2Money),true)
    .addBlankField(true)
    .addField('Items', getDisplay(app, player1Items, log).join('\n'), true)
    .addField('Items', getDisplay(app, player2Items, log).join('\n'), true)
    .addBlankField(true)
    .addBlankField()
    .addField('Value', app.common.formatNumber(getValue(app, player1Money, player1Items)), true)
    .addField('Value', app.common.formatNumber(getValue(app, player2Money, player2Items)), true)
    .addBlankField(true)
    .setFooter("Commands: "+prefix+"add <item> <amount> | "+prefix+"addmoney <amount> | "+prefix+"accept | "+prefix+"cancel")

    return tradeWindow;
}

function getValue(app, playerMoney, playerItems){
    let value = playerMoney;

    for(let i = 0; i < playerItems.length; i++){
        value += app.itemdata[playerItems[i].split('|')[0]].sell * playerItems[i].split('|')[1];
    }

    return value;
}

function getDisplay(app, itemList, log = false){
    let items = [];
    
    for(let i = 0; i < itemList.length; i++){
        items.push(itemList[i].split('|')[1] + 'x ' + (!log ? app.itemdata[itemList[i].split('|')[0]].icon : '') + '`' + itemList[i].split('|')[0] + '`')
    }

    if(!items.length) items.push('None');

    return items;
}

function listHasItem(itemList, item){
    for(let i = 0; i < itemList.length; i++){
        if(itemList[i].split('|')[0] === item) return true;
    }
    
    return false;
}

async function tradeItems(app, player1, player1Money, player1Items, player2, player2Money, player2Items){
    if(!await app.player.hasMoney(player1.id, player1Money)) throw {player: player1, msg: 'does not have the money they wanted to trade.'};
    if(!await app.player.hasMoney(player2.id, player2Money)) throw {player: player2, msg: 'does not have the money they wanted to trade.'};

    if(!await app.itm.hasItems(player1.id, player1Items)) throw {player: player1, msg: 'does not have the items they wanted to trade.'};
    if(!await app.itm.hasItems(player2.id, player2Items)) throw {player: player2, msg: 'does not have the items they wanted to trade.'};

    if(!await app.itm.hasSpace(player1.id, app.itm.getTotalItmCountFromList(player2Items) - app.itm.getTotalItmCountFromList(player1Items))) throw {player: player1, msg: 'does not have enough space in their inventory.'};
    if(!await app.itm.hasSpace(player2.id, app.itm.getTotalItmCountFromList(player1Items) - app.itm.getTotalItmCountFromList(player2Items))) throw {player: player2, msg: 'does not have enough space in their inventory.'};

    await app.player.removeMoney(player1.id, player1Money);
    await app.player.removeMoney(player2.id, player2Money);

    await app.itm.removeItem(player1.id, player1Items);
    await app.itm.removeItem(player2.id, player2Items);

    await app.player.addMoney(player1.id, player2Money);
    await app.player.addMoney(player2.id, player1Money);

    await app.itm.addItem(player1.id, player2Items);
    await app.itm.addItem(player2.id, player1Items);
}

function tradeCompleted(app, embed, player1, player2){
    try{
        embed.setTitle('Trade Log')
        embed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/white-heavy-check-mark_2705.png')
        embed.setDescription(player1.tag + ' ID: ```\n' + player1.id + '```' + player2.tag + ' ID: ```\n' + player2.id + '```')
        embed.setTimestamp()
        embed.setFooter('Keep an eye on users that trade low-value for high-value')
        
        app.messager.messageLogs(embed);
    }
    catch(err){
        console.warn(err);
    }
}
const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const config = require('../json/_config.json');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'trade',
    aliases: [''],
    description: 'Trade items and money with another player.',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var userNameID = general.getUserId(args);

        if(!general.isUser(args)){
            return message.reply(lang.errors[1]);
        }

        try{
            const tradeUser = await general.getUserInfo(message, userNameID, true);
            const victimRow = (await query(`SELECT * FROM scores WHERE userId ="${tradeUser.id}"`))[0];
            const playRow   = (await query(`SELECT * FROM userGuilds WHERE userId ="${tradeUser.id}" AND guildId = "${message.guild.id}"`))

            if(tradeUser.id === message.client.user.id){
                return message.reply(lang.trade.errors[1]);
            }
            else if(tradeUser.id === message.author.id){
                return message.reply(lang.trade.errors[2]);
            }
            else if(!victimRow){
                return message.reply(lang.errors[0]);
            }
            else if(message.client.sets.tradeBanned.has(tradeUser.id)){
                return message.reply("User is trade banned.");
            }
            else if(!playRow.length){
                return message.reply(lang.use.errors[7]);
            }
            else if(message.client.sets.peckCooldown.has(tradeUser.id)){
                return message.reply(lang.trade.errors[0]);
            }
            else if(message.client.sets.activeCmdCooldown.has(tradeUser.id)){
                return message.reply("This user has an active command running! Wait for them to finish the command before trading with them.");
            }

            const botMessage = await message.channel.send(lang.trade.trading[0].replace('{0}', tradeUser).replace('{1}', message.member.displayName));
            await botMessage.react('✅');
            await botMessage.react('❌');
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === tradeUser.id;
            };
            
            try{
                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 30000, errors: ['time'] });
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    const tradeWindow = new Discord.RichEmbed()
                    .setTitle("**Trade window**")
                    .setColor(2713128)
                    .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/568469679081914435/tradeIcon.png")
                    .addField(message.member.displayName + "'s Offer", methods.formatMoney(0) + '\n\nItems:\nNone',true)
                    .addField(tradeUser.displayName + "'s Offer", methods.formatMoney(0) + '\n\nItems:\nNone',true)
                    .setFooter("Commands : "+prefix+"add <item> <amount> | "+prefix+"addmoney <amount> | "+prefix+"accept | "+prefix+"cancel")
                    message.channel.send(tradeWindow);

                    const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id || m.author.id == tradeUser.id, { time: 300000 });
                    let player1money = 0; //this is person who started trade
                    let player2money = 0; //this is person asked to trade with
                    
                    let player1items = [];
                    let player1itemsAmounts = [];
                    let player1display = [];
                    let player2items = [];
                    let player2itemsAmounts = [];
                    let player2display = [];

                    let isPlayer1 = 0; //0 means trade was cancelled, 1 means player1 accepted, 2 means player2 accepted

                    function activeWindow(option, tradeCode = '1000'){
                        if(option == 1){
                            const activeWindow = new Discord.RichEmbed()
                            .setTitle(tradeCode == '1000' ? "**🔃Trade log**" : "**❌Trade incompleted** `" + tradeCode + "`")
                            .setDescription(tradeUser.user.username + " ID : " + userNameID + " TRADED WITH\n" + message.author.username + " ID : " + message.author.id)
                            .setColor(tradeCode == '1000' ? 2713128 : 1)
                            .setThumbnail(tradeCode == '1000' ? "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/white-heavy-check-mark_2705.png" : "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/cross-mark_274c.png")
                            .addField(message.author.username + "'s MONEY", "$" + player1money,true)
                            .addField(tradeUser.user.username + "'s MONEY", "$" + player2money,true)
                            .setFooter("Keep an eye on users that trade high-value for low-value")
                            if(player1items.length > 0){
                                activeWindow.addField(message.author.username + "'s items",player1display.join(", "), true);
                            }
                            else{
                                activeWindow.addField(message.author.username + "'s items","no items", true);
                            }
                            if(player2items.length > 0){
                                activeWindow.addField(tradeUser.user.username + "'s items", player2display.join(", "), true);
                            }
                            else{
                                activeWindow.addField(tradeUser.user.username + "'s items", "no items", true);
                            }
                            //VVV TRADE CODE HANDLING VVV
                            var errorCodes = {
                                _0001: message.author.username + " didn't have enough space in their inventory.",
                                _0002: tradeUser.user.username +" didn't have enough space in their inventory.",
                                _0003: tradeUser.user.username +" didn't have enough money.",
                                _0004: message.author.username +" didn't have enough money.",
                                _0005: tradeUser.user.username +" didn't have the items they originally wanted to trade.",
                                _0006: message.author.username +" didn't have the items they originally wanted to trade.",
                            }
                            if(tradeCode !== '1000'){
                                activeWindow.setFooter(tradeCode + " => " + errorCodes["_" + tradeCode]);
                            }
                            
                            return message.client.shard.broadcastEval(`
                                const channel = this.channels.get('${config.logChannel}');
                        
                                if(channel){
                                    channel.send({embed: {
                                            color: ${tradeCode == '1000' ? 2713128 : 1},
                                            title: "${tradeCode == '1000' ? "**🔃Trade log**" : "**❌Trade incompleted** `" + tradeCode + "`"}",
                                            description: "${tradeUser.user.username + " ID : " + userNameID + " TRADED WITH " + message.author.username + " ID : " + message.author.id}",
                                            thumbnail: {
                                                url: "${tradeCode == '1000' ? "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/white-heavy-check-mark_2705.png" : "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/cross-mark_274c.png"}"
                                            },
                                            fields: [
                                                {
                                                    name: "${message.author.username + "'s MONEY"}",
                                                    value: "${"$" + player1money}",
                                                    inline: true
                                                },
                                                {
                                                    name: "${tradeUser.user.username + "'s MONEY"}",
                                                    value: "${"$" + player2money}",
                                                    inline: true
                                                },
                                                {
                                                    name: "\u200b",
                                                    value: "\u200b",
                                                    inline: false
                                                },
                                                {
                                                    name: "${message.author.username + "'s items"}",
                                                    value: "${player1items.length > 0 ? player1display.join(", ") : "no items"}",
                                                    inline: true
                                                },
                                                {
                                                    name: "${tradeUser.user.username + "'s items"}",
                                                    value: "${player2items.length > 0 ? player2display.join(", ") : "no items"}",
                                                    inline: true
                                                }
                                            ],
                                            footer: {
                                                text: "${tradeCode !== '1000' ? tradeCode + " => " + errorCodes["_" + tradeCode] : "Keep an eye on users that trade high-value for low-value"}"
                                            },
                                        }
                                    });
                                    true;
                                }
                                else{
                                    false;
                                }
                            `).then(console.log);
                        }
                        else{
                            const activeWindow = new Discord.RichEmbed()
                            .setTitle("**Trade window**")
                            .setColor(2713128)
                            .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/568469679081914435/tradeIcon.png")
                            .setFooter("Commands : "+prefix+"add <item> <amount> | "+prefix+"remove <item> | "+prefix+"addmoney <amount> | "+prefix+"accept | "+prefix+"cancel")
                            if(player1items.length > 0){
                                activeWindow.addField(message.member.displayName + "'s Offer", methods.formatMoney(player1money) + '\n\nItems:\n' + player1display.join("\n"),true)
                            }
                            else{
                                activeWindow.addField(message.member.displayName + "'s Offer", methods.formatMoney(player1money) + '\n\nItems:\nNone',true)
                            }
                            if(player2items.length > 0){
                                activeWindow.addField(tradeUser.displayName + "'s Offer", methods.formatMoney(player2money) + '\n\nItems:\n' + player2display.join("\n"),true)
                            }
                            else{
                                activeWindow.addField(tradeUser.displayName + "'s Offer", methods.formatMoney(player2money) + '\n\nItems:\nNone',true)
                            }
                            message.channel.send(activeWindow);
                        }
                    }

                    collector.on("collect", response => {
                        response.content = response.content.toLowerCase();
                        
                        if(response.content.startsWith(prefix + "cancel")){
                            message.channel.send(lang.trade.trading[1]);
                            collector.stop();
                        }
                        else if(response.content.startsWith(prefix + "accept")){
                            if(response.member.id == message.author.id){
                                isPlayer1 = 1;
                            }
                            else{
                                isPlayer1 = 2;
                            }
                            collector.stop();
                        }
                        else if(response.content.startsWith(prefix + "addmoney")){
                            let args = response.content.split(" ").slice(1);
                            let tradeAmount = args[0];
                            if(tradeAmount % 1 !== 0 || tradeAmount <= 0){
                                response.reply(lang.trade.trading[2].replace('{0}', prefix));
                            }
                            else{
                                if(response.member.id == message.author.id){
                                    player1money += parseInt(tradeAmount);
                                    methods.hasmoney(response.member.id, player1money).then(result => {
                                        if(!result){
                                            response.reply(lang.trade.errors[4]);
                                            player1money -= parseInt(tradeAmount);
                                        }
                                        activeWindow();
                                    });
                                }
                                else{
                                    player2money += parseInt(tradeAmount);
                                    methods.hasmoney(response.member.id, player2money).then(result => {
                                        if(!result){
                                            response.reply(lang.trade.errors[4]);
                                            player2money -= parseInt(tradeAmount);
                                        }
                                        activeWindow();
                                    });
                                }
                            }
                        }
                        else if(response.content.startsWith(prefix+ "remove")){
                            let args = response.content.split(/ +/).slice(1);
                            let removeThis = general.parseArgsWithSpaces(args[0], args[1], args[2]);
                            if(itemdata[removeThis] == undefined){
                                if(removeThis == "money"){
                                    if(response.member.id == message.author.id){
                                        player1money = 0;
                                        response.reply(lang.trade.trading[3]);
                                    }
                                    else{
                                        player2money = 0;
                                        response.reply(lang.trade.trading[3]);
                                    }
                                    activeWindow();
                                }
                                else response.reply(lang.errors[4]);
                            }
                            else{
                                if(response.member.id == message.author.id){
                                    if(player1items.includes(removeThis)){
                                        for(var i = 0; i < player1items.length; i++){
                                            if(player1items[i] == removeThis){
                                                //remove item
                                                player1items.splice(i, 1);
                                                player1display.splice(i, 1);
                                                player1itemsAmounts.splice(i, 1);
                                                response.reply(lang.trade.trading[4].replace('{0}', removeThis));
                                                activeWindow();
                                                break;
                                            }
                                        }
                                    }
                                    else response.reply(lang.trade.errors[5]);
                                }
                                else{
                                    if(player2items.includes(removeThis)){
                                        for(var i = 0; i < player2items.length; i++){
                                            if(player2items[i] == removeThis){
                                                //remove item
                                                player2items.splice(i, 1);
                                                player2display.splice(i, 1);
                                                player2itemsAmounts.splice(i, 1);
                                                response.reply(lang.trade.trading[4].replace('{0}', removeThis));
                                                activeWindow();
                                                break;
                                            }
                                        }
                                    }
                                    else response.reply(lang.trade.errors[5]);
                                }
                            }
                        }
                        else if(response.content.startsWith(prefix+"add")){
                            let args = response.content.split(/ +/).slice(1);
                            let itemName = general.parseArgsWithSpaces(args[0], args[1], args[2]);
                            let itemAmount = general.parseArgsWithSpaces(args[0], args[1], args[2], true);
        
                            if(itemdata[itemName] == undefined){
                                response.reply(lang.errors[4]);
                            }
                            else if(!itemdata[itemName].canBeStolen){
                                response.reply(lang.trade.errors[6]);
                            }
                            else{
                                if(itemAmount == undefined || !Number.isInteger(parseInt(itemAmount)) || itemAmount % 1 !== 0 || itemAmount < 1){
                                    itemAmount = 1;
                                }
                                if(response.member.id == message.author.id){
                                    if(player1items.includes(itemName) || player2items.includes(itemName)){
                                        response.reply(lang.trade.errors[7]);
                                    }
                                    else{
                                        methods.hasitems(response.member.id, itemName, itemAmount).then(result => {
                                            if(result){
                                                player1items.push(itemName);
                                                player1itemsAmounts.push(itemName+"|"+itemAmount);
                                                player1display.push(itemdata[itemName].icon + itemName + "("+itemAmount+"x)");
                                            }
                                            else response.reply(lang.use.errors[2]);
                                            activeWindow();
                                        });
                                    }
                                }
                                else{
                                    if(player1items.includes(itemName) || player2items.includes(itemName)){
                                        response.reply(lang.trade.errors[7]);
                                    }
                                    else{
                                        methods.hasitems(response.member.id, itemName, itemAmount).then(result => {
                                            if(result){
                                                player2items.push(itemName);
                                                player2itemsAmounts.push(itemName+"|"+itemAmount);
                                                player2display.push(itemdata[itemName].icon + itemName + "("+itemAmount+"x)");
                                            }
                                            else response.reply(lang.use.errors[2]);
                                            activeWindow();
                                        });  
                                    }
                                }
                            }
                        }
                    });
                    collector.on("end", async response => {
                        async function swapItems(){
                            const messageAuthorHasEnough = await methods.hasenoughspace(message.author.id, methods.getTotalItmCountFromList(player2itemsAmounts) - methods.getTotalItmCountFromList(player1itemsAmounts));
                            const player2HasEnough = await methods.hasenoughspace(userNameID, methods.getTotalItmCountFromList(player1itemsAmounts) - methods.getTotalItmCountFromList(player2itemsAmounts));
                            const player2HasMoney = await methods.hasmoney(userNameID, player2money);
                            const player1HasMoney = await methods.hasmoney(message.author.id, player1money);
                            const player2HasItems = await methods.hasitems(userNameID, player2itemsAmounts);
                            const player1HasItems = await methods.hasitems(message.author.id, player1itemsAmounts);

                            if(!messageAuthorHasEnough){
                                message.channel.send(lang.trade.errors[8].replace('{0}', message.member.displayName));
                                return '0001';
                            }
                            else if(!player2HasEnough){
                                message.channel.send(lang.trade.errors[8].replace('{0}', tradeUser.displayName));
                                return '0002';
                            }
                            else if(!player2HasMoney){
                                message.channel.send("❌ Trade could not be completed! `0003`"); // player2 didn't have enough money
                                return '0003';
                            }
                            else if(!player1HasMoney){
                                message.channel.send("❌ Trade could not be completed! `0004`") // player1 didn't have enough money
                                return '0004';
                            }
                            else if(!player2HasItems){
                                message.channel.send("❌ Trade could not be completed! `0005`") // player2 didnt have the items they wanted to trade
                                return '0005';
                            }
                            else if(!player1HasItems){
                                message.channel.send("❌ Trade could not be completed! `0006`") // player1 didnt have the items they wanted to trade
                                return '0006';
                            }
                            else{ // Trade items
                                methods.trademoney(message.author.id, player1money, userNameID, player2money);
        
                                methods.additem(message.author.id, player2itemsAmounts);
                                methods.removeitem(userNameID, player2itemsAmounts);
                                methods.additem(userNameID, player1itemsAmounts);
                                methods.removeitem(message.author.id, player1itemsAmounts);
                                message.channel.send(lang.trade.trading[7]);
                                return '1000';
                            }
                        }
                        if(isPlayer1 === 1){
                            const botMessage = await message.channel.send(lang.trade.trading[5].replace('{0}', tradeUser).replace('{1}', message.member.displayName));
                            await botMessage.react('✅');
                            await botMessage.react('❌');
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === userNameID;
                            };

                            try{
                                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 25000, errors: ['time'] });
                                const reaction = collected.first();

                                if(reaction.emoji.name === '✅'){
                                    botMessage.delete();
                                    const tradeCode = await swapItems();
                                    activeWindow(1, tradeCode);
                                }
                                else{
                                    botMessage.delete();
                                    message.channel.send(lang.trade.trading[6].replace('{0}', tradeUser));
                                }
                            }
                            catch(err){
                                botMessage.delete();
                                message.reply(lang.errors[3]);
                            }
                        }
                        else if(isPlayer1 === 2){
                            const botMessage = await message.channel.send(lang.trade.trading[5].replace('{0}', message.author).replace('{1}', tradeUser.displayName));
                            await botMessage.react('✅')
                            await botMessage.react('❌');
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                            };
                            
                            try{
                                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 25000, errors: ['time'] });
                                const reaction = collected.first();

                                if(reaction.emoji.name === '✅'){
                                    botMessage.delete();
                                    const tradeCode = await swapItems();
                                    activeWindow(1, tradeCode); //sends log to mods
                                }
                                else{
                                    botMessage.delete();
                                    message.channel.send(lang.trade.trading[6].replace('{0}', message.author));
                                }
                            }
                            catch(err){
                                botMessage.delete();
                                message.channel.send(lang.errors[3]);
                            }
                        }
                    });
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
        catch(err){
            message.reply(lang.errors[1]);
        }
    },
}
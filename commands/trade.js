const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const config = require('../json/_config.json');
const itemdata = require('../json/completeItemList.json');

//TODO Rewrite with async/await

module.exports = {
    name: 'trade',
    aliases: [''],
    description: 'Trade items and money with another player.',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
            var userOldID = args[0];
            var userNameID = userOldID.replace(/[<@!>]/g, '');

            if(!userOldID.startsWith("<@")){
                return message.reply(lang.errors[1]);
            }
            message.client.fetchUser(userNameID).then(tradeUser => {
                query(`SELECT * FROM scores WHERE userId ="${tradeUser.id}"`).then(victimRow => {
                    query(`SELECT * FROM userGuilds WHERE userId ="${tradeUser.id}" AND guildId = "${message.guild.id}"`).then(playRow => {
                        if(tradeUser.id === message.client.user.id){
                            return message.reply(lang.trade.errors[1]);
                        }
                        else if(tradeUser.id === message.author.id){
                            return message.reply(lang.trade.errors[2]);
                        }
                        else if(!victimRow.length){
                            return message.reply(lang.errors[0]);
                        }
                        else if(!playRow.length){
                            return message.reply(lang.use.errors[7]);
                        }
                        else if(message.client.sets.peckCooldown.has(tradeUser.id)){
                            return message.reply(lang.trade.errors[0]);
                        }
                        //BEGIN TRADE
                        message.channel.send(lang.trade.trading[0].replace('{0}', tradeUser).replace('{1}', message.member.displayName)).then(async reactMsg => {
                            await reactMsg.react('✅');
                            await reactMsg.react('❌');
                            return reactMsg;
                        }).then(botMessage => {
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === tradeUser.id;
                            };
                            botMessage.awaitReactions(filter, {max: 1, time: 30000, errors: ['time'] }).then(collected => {
                                const reaction = collected.first();

                                if(reaction.emoji.name === '✅'){//trades accepted
                                    botMessage.delete();

                                    const tradeWindow = new Discord.RichEmbed()
                                    .setTitle("**Trade window**")
                                    .setColor(2713128)
                                    .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/568469679081914435/tradeIcon.png")
                                    .addField("🔵"+message.member.displayName + "'s money", "$0",true)
                                    .addField("🔴"+message.guild.members.get(tradeUser.id).displayName + "'s money", "$0",true)
                                    .addField("🔵"+message.member.displayName + "'s items", "no items", true)
                                    .addField("🔴"+message.guild.members.get(tradeUser.id).displayName + "'s items", "no items",true)
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
                                            .setDescription(message.guild.members.get(userNameID).user.username + " ID : " + userNameID + " TRADED WITH\n" + message.author.username + " ID : " + message.author.id)
                                            .setColor(tradeCode == '1000' ? 2713128 : 1)
                                            .setThumbnail(tradeCode == '1000' ? "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/white-heavy-check-mark_2705.png" : "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/cross-mark_274c.png")
                                            .addField(message.author.username + "'s MONEY", "$" + player1money,true)
                                            .addField(message.guild.members.get(userNameID).user.username + "'s MONEY", "$" + player2money,true)
                                            .setFooter("Keep an eye on users that trade high-value for low-value")
                                            if(player1items.length > 0){
                                                activeWindow.addField(message.author.username + "'s items",player1display.join(", "), true);
                                            }
                                            else{
                                                activeWindow.addField(message.author.username + "'s items","no items", true);
                                            }
                                            if(player2items.length > 0){
                                                activeWindow.addField(message.guild.members.get(userNameID).user.username + "'s items", player2display.join(", "), true);
                                            }
                                            else{
                                                activeWindow.addField(message.guild.members.get(userNameID).user.username + "'s items", "no items", true);
                                            }
                                            //VVV TRADE CODE HANDLING VVV
                                            var errorCodes = {
                                                _0001: message.author.username + " didn't have enough space in their inventory.",
                                                _0002: message.guild.members.get(userNameID).user.username +" didn't have enough space in their inventory.",
                                                _0003: message.guild.members.get(userNameID).user.username +" didn't have enough money.",
                                                _0004: message.author.username +" didn't have enough money.",
                                                _0005: message.guild.members.get(userNameID).user.username +" didn't have the items they originally wanted to trade.",
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
                                                            description: "${message.guild.members.get(userNameID).user.username + " ID : " + userNameID + " TRADED WITH " + message.author.username + " ID : " + message.author.id}",
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
                                                                    name: "${message.guild.members.get(userNameID).user.username + "'s MONEY"}",
                                                                    value: "${"$" + player2money}",
                                                                    inline: true
                                                                },
                                                                {
                                                                    name: "${message.author.username + "'s items"}",
                                                                    value: "${player1items.length > 0 ? player1display.join(", ") : "no items"}",
                                                                    inline: true
                                                                },
                                                                {
                                                                    name: "${message.guild.members.get(userNameID).user.username + "'s items"}",
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
                                            .addField("🔵"+message.member.displayName + "'s money", methods.formatMoney(player1money),true)
                                            .addField("🔴"+message.guild.members.get(userNameID).displayName + "'s money", methods.formatMoney(player2money),true)
                                            .setFooter("Commands : "+prefix+"add <item> <amount> | "+prefix+"remove <item> | "+prefix+"addmoney <amount> | "+prefix+"accept | "+prefix+"cancel")
                                            if(player1items.length > 0){
                                                activeWindow.addField("🔵"+message.member.displayName + "'s items",player1display.join("\n"), true);
                                            }
                                            else{
                                                activeWindow.addField("🔵"+message.member.displayName + "'s items","no items", true)
                                            }
                                            if(player2items.length > 0){
                                                activeWindow.addField("🔴"+message.guild.members.get(userNameID).displayName + "'s items", player2display.join("\n"), true);
                                            }
                                            else{
                                                activeWindow.addField("🔴"+message.guild.members.get(userNameID).displayName + "'s items", "no items", true)
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
                                                        console.log(result);
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
                                            let args = response.content.split(" ").slice(1);
                                            let removeThis = args[0];
                                            removeThis = methods.getCorrectedItemInfo(removeThis);
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
                                            let args = response.content.split(" ").slice(1);
                                            let itemName = args[0];
                                            let itemAmount = args[1];
                                            itemName = methods.getCorrectedItemInfo(itemName);
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
                                                                player1display.push(itemName+"("+itemAmount+"x)");
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
                                                                player2display.push(itemName+"("+itemAmount+"x)");
                                                            }
                                                            else response.reply(lang.use.errors[2]);
                                                            activeWindow();
                                                        });  
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    collector.on("end", response => {
                                        function swapItems(){
                                            return methods.hasenoughspace(message.author.id, methods.getTotalItmCountFromList(player2itemsAmounts) - methods.getTotalItmCountFromList(player1itemsAmounts)).then(messageAuthorHasEnough => {
                                                if(messageAuthorHasEnough){
                                                    return methods.hasenoughspace(userNameID, methods.getTotalItmCountFromList(player1itemsAmounts) - methods.getTotalItmCountFromList(player2itemsAmounts)).then(player2HasEnough => {
                                                        if(player2HasEnough){
                                                            return methods.hasmoney(userNameID, player2money).then(result => {
                                                                //give player2money to player1
                                                                if(result){
                                                                    return methods.hasmoney(message.author.id, player1money).then(result => {
                                                                        if(result){
                                                                            return methods.hasitems(userNameID, player2itemsAmounts).then(result => {
                                                                                if(result){
                                                                                    return methods.hasitems(message.author.id, player1itemsAmounts).then(result => {
                                                                                        if(result){
                                                                                            //finally trade items

                                                                                            methods.trademoney(message.author.id, player1money, userNameID, player2money);
            
                                                                                            methods.additem(message.author.id, player2itemsAmounts);
                                                                                            methods.removeitem(userNameID, player2itemsAmounts);
                                                                                            methods.additem(userNameID, player1itemsAmounts);
                                                                                            methods.removeitem(message.author.id, player1itemsAmounts);
                                                                                            message.channel.send(lang.trade.trading[7]);
                                                                                            return '1000';
                                                                                        }
                                                                                        else message.channel.send("❌ Trade could not be completed! `0006`")//player1 didnt have the items they wanted to trade
                                                                                        return '0006';
                                                                                    });
                                                                                }
                                                                                else message.channel.send("❌ Trade could not be completed! `0005`")//player2 didnt have the items they wanted to trade
                                                                                return '0005';
                                                                            });
                                                                        }
                                                                        else message.channel.send("❌ Trade could not be completed! `0004`")//player1 didn't have enough money
                                                                        return '0004';
                                                                    });
                                                                }
                                                                else message.channel.send("❌ Trade could not be completed! `0003`")//player2 didn't have enough money
                                                                return '0003';
                                                            });
                                                        }
                                                        else message.channel.send(lang.trade.errors[8].replace('{0}', message.guild.members.get(userNameID).displayName));
                                                        return '0002';
                                                    });
                                                }
                                                else message.channel.send(lang.trade.errors[8].replace('{0}', message.member.displayName)); //"❌" + message.member.displayName + " doesn't have enough space in their inventory to complete this trade!" message.guild.members.get(userNameID).displayName
                                                return '0001';
                                            });
                                        }
                                        let playerGiveTotal = player1money - player2money;
                                        if(isPlayer1 === 1){
                                            message.channel.send(lang.trade.trading[5].replace('{0}', tradeUser).replace('{1}', message.member.displayName)).then(botMessage => {
                                                botMessage.react('✅').then(() => botMessage.react('❌'));
                                                const filter = (reaction, user) => {
                                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === userNameID;
                                                };
                                                botMessage.awaitReactions(filter, {max: 1, time: 25000, errors: ['time'] })
                                                .then(collected => {
                                                    const reaction = collected.first();
                    
                                                    if(reaction.emoji.name === '✅'){
                                                        botMessage.delete();
                                                        swapItems().then(tradeCode => {
                                                            activeWindow(1, tradeCode); //sends log to mods
                                                        }); //verifies users have items before completing trade.
                                                    }
                                                    else{
                                                        botMessage.delete();
                                                        message.channel.send(lang.trade.trading[6].replace('{0}', tradeUser));
                                                    }
                                                }).catch(collected => {
                                                    console.error();
                                                    botMessage.delete();
                                                    message.reply(lang.errors[3]);
                                                });
                                            });
                                        }
                                        else if(isPlayer1 === 2){
                                            message.channel.send(lang.trade.trading[5].replace('{0}', message.author).replace('{1}', message.guild.members.get(userNameID).displayName)).then(botMessage => {
                                                botMessage.react('✅').then(() => botMessage.react('❌'));
                                                const filter = (reaction, user) => {
                                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                                };
                                                botMessage.awaitReactions(filter, {max: 1, time: 25000, errors: ['time'] })
                                                .then(collected => {
                                                    const reaction = collected.first();
                    
                                                    if(reaction.emoji.name === '✅'){
                                                        botMessage.delete();
                                                        swapItems().then(tradeCode => {
                                                            activeWindow(1, tradeCode); //sends log to mods
                                                        });
                                                    }
                                                    else{
                                                        botMessage.delete();
                                                        message.channel.send(lang.trade.trading[6].replace('{0}', message.author));
                                                    }
                                                }).catch(collected => {
                                                    console.log(collected);
                                                    botMessage.delete();
                                                    message.channel.send(lang.errors[3]);
                                                });
                                            });
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
                    });
                });
            }).catch(err => {
                return message.reply(lang.errors[1]);
            });
        });
    },
}
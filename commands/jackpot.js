const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

// Should the jackpot cooldown be per-user or per-server? Will start with per-user

module.exports = {
    name: 'jackpot',
    aliases: [''],
    description: 'Start a jackpot prize pool that other users can enter for a chance to win it all!',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var gambleAmount = args[0];

        var jackpotObj = {};

        if(message.client.restartLockdown){
            return message.reply('The jackpot command has been disabled to prevent issues causes by a bot update! Should be back soon')
        }

        if(gambleAmount !== undefined && gambleAmount >= 100){
            gambleAmount = Math.floor(gambleAmount);
        }
        else{
            //give user info on jackpot command
            return message.reply(lang.jackpot[1]);
        }
        
        const hasMoney = await methods.hasmoney(message.author.id, gambleAmount);

        if(!hasMoney){
            return message.reply(lang.buy[4]);
        }
        else if(gambleAmount > 50000){
            return message.reply(lang.jackpot[2]);
        }
        // Check if there's already an active jackpot in the server.
        else if(message.client.sets.jackpotServers.has(message.guild.id)){
            // jackpot active
            message.reply(lang.jackpot[3]);
        }
        else if(message.client.sets.jackpotCooldown.has(message.author.id)){
            // TODO replace gambleTime
            const timeRow = await query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`);
            return message.reply(lang.general[10].replace('{0}', ((300 * 1000 - ((new Date()).getTime() - timeRow[0].jackpotTime)) / 1000).toFixed(0)));
        }
        else{
            message.reply(lang.jackpot[0].replace('{0}', methods.formatMoney(gambleAmount))).then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(async collected => {
                    const reaction = collected.first();
    
                    if(reaction.emoji.name === '✅'){
                        const hasMoney2 = await methods.hasmoney(message.author.id, gambleAmount);

                        if(!hasMoney2){
                            botMessage.delete();
                            message.reply(lang.buy[4]);
                        }
                        else if(message.client.sets.jackpotServers.has(message.guild.id)){
                            message.reply(lang.jackpot[3]);
                        }
                        else{
                            jackpotObj[message.author.id] = {name: message.author.username, amount: gambleAmount};
                            message.channel.send(lang.jackpot[4]);
                            message.channel.send(refreshEmbed(jackpotObj, prefix));
                            methods.removemoney(message.author.id, gambleAmount);

                            query(`UPDATE cooldowns SET jackpotTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            message.client.shard.broadcastEval(`this.sets.jackpotCooldown.add('${message.author.id}')`);
                            setTimeout(() => {
                                message.client.shard.broadcastEval(`this.sets.jackpotCooldown.delete('${message.author.id}')`);
                                query(`UPDATE cooldowns SET jackpotTime = ${0} WHERE userId = ${message.author.id}`);
                            }, 300 * 1000);
                            message.client.sets.jackpotServers.add(message.guild.id);
                            

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[5].replace('{0}', '1 minute').replace('{1}', prefix));
                            }, 60000)

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[5].replace('{0}', '30 seconds').replace('{1}', prefix));
                            }, 90000)

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[5].replace('{0}', '10 seconds').replace('{1}', prefix));
                            }, 110000)

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[6].replace('{0}', '5'));
                            }, 115000)

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[6].replace('{0}', '4'));
                            }, 116000)

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[6].replace('{0}', '3'));
                            }, 117000)
                            
                            setTimeout(() => {
                                message.channel.send(lang.jackpot[6].replace('{0}', '2'));
                            }, 118000)

                            setTimeout(() => {
                                message.channel.send(lang.jackpot[7]);
                            }, 119000)
                            
                            

                            const collector = new Discord.MessageCollector(message.channel, m => {
                                return !m.author.bot && m.content.toLowerCase().startsWith(prefix + 'join');
                            }, { time: 120000 });

                            collector.on("collect", async response => {
                                const activeRow = await query(`SELECT * FROM userGuilds WHERE userId = ${response.author.id} AND guildId = ${response.guild.id}`);
                                const userArgs = response.content.slice(prefix.length).split(/ +/);
                                var gambleAmount = userArgs[1];

                                if(!activeRow.length) return response.reply(lang.general[1].replace('{0}', prefix));

                                else if(jackpotObj.hasOwnProperty(response.author.id)){
                                    return response.reply(lang.jackpot[8]);
                                }
                                else if(Object.keys(jackpotObj).length >= 15){
                                    return response.reply(lang.jackpot[9])
                                }
                                else if(gambleAmount !== undefined && gambleAmount >= 100){
                                    gambleAmount = Math.floor(gambleAmount);
                                }
                                else{
                                    //give user info on jackpot command
                                    return response.reply(lang.jackpot[1]);
                                }

                                const hasMoney = await methods.hasmoney(response.author.id, gambleAmount);
                                if(!hasMoney){
                                    return message.reply(lang.buy[4]);
                                }
                                else if(gambleAmount > 50000){
                                    return message.reply(lang.jackpot[2]);
                                }
                                else{
                                    jackpotObj[response.author.id] = {name: response.author.username, amount: gambleAmount};
                                    methods.removemoney(response.author.id, gambleAmount);
                                    response.channel.send(refreshEmbed(jackpotObj, prefix));
                                }
                            });
                            collector.on("end", response => {
                                message.client.sets.jackpotServers.delete(message.guild.id);

                                var winnerId = pickWinner(jackpotObj);
                                var winAmount = getJackpotTotal(jackpotObj);

                                message.channel.send(lang.jackpot[10].replace('{0}', jackpotObj[winnerId].name).replace('{1}', methods.formatMoney(winAmount)).replace('{2}', (jackpotObj[winnerId].amount / getJackpotTotal(jackpotObj) * 100).toFixed(1)));

                                methods.addmoney(winnerId, winAmount);
                            });
                        }
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    console.log(collected);
                    message.reply(lang.errors[3]);
                });
            });
        }
    },
}

function refreshEmbed(jackpotObj, prefix){
    var usersArr = [];
    var usersChances = [];

    Object.keys(jackpotObj).forEach(user => {
        usersArr.push((jackpotObj[user].name).slice(0, 18).padEnd(20) + methods.formatMoney(jackpotObj[user].amount).padEnd(15) + ((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1) + '%');

        usersChances.push(((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1));
        i++;
    });

    //usersChances.sort(function(a, b){return b - a});
    usersArr.sort(function(a, b){
        return parseFloat(b.substr(-5, b.indexOf('%')).substr(0, 4)) - parseFloat(a.substr(-5, a.indexOf('%')).substr(0, 4));
    });

    for(var i = 0; i < usersArr.length; i++){
        usersArr[i] = (i + 1) + '.' + usersArr[i];
    }

    usersArr.unshift(('Player').padEnd(22) + 'Bet'.padEnd(15) + 'Chance');

    const jackpotEmbed = new Discord.RichEmbed()
    .setColor(14202368)
    .setTitle('JACKPOT - Win it all!')
    .addField('🎟 Current entrants', '```cs\n' + usersArr.join('\n') + '```')
    .addField('💰 Prize pool', '```fix\n' + methods.formatMoney(getJackpotTotal(jackpotObj)) + '```')
    .setFooter('Use ' + prefix + 'join <amount> to enter!')
    return jackpotEmbed;
}

function getJackpotTotal(jackpotObj){
    var total = 0;
    Object.keys(jackpotObj).forEach(user => {
        total += jackpotObj[user].amount;
    });

    return total;
}

function pickWinner(jackpotObj){
    var entrants = []; // add the entrants userid's to this array x amount of times based on their win chance

    Object.keys(jackpotObj).forEach(user => {
        var amountToAdd = 0;

        amountToAdd = Math.floor(((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1));

        for(var i = 0; i < amountToAdd; i++){
            entrants.push(user);
        }
    });

    return entrants[Math.floor(Math.random() * entrants.length)];
}
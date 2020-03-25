
module.exports = {
    name: 'jackpot',
    aliases: [''],
    description: 'Start a jackpot prize pool that other users can enter for a chance to win it all!',
    long: 'Start a server jackpot that lasts 2 minutes! Other players can join the jackpot with the join command. The more you put into the pot, the higher your chance of winning it all.',
    args: {"amount": "Amount of money to gamble."},
    examples: ["jackpot 1000"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const jackpotCD = await app.cd.getCD(message.author.id, 'jackpot');
        let gambleAmount = app.parse.numbers(message.args)[0];
        let jackpotObj = {};

        /*
        if(message.client.restartLockdown){
            return message.reply('This command has been disabled to prevent issues causes by a bot update! Should be back soon')
        }
        */

       if(jackpotCD){
            return message.reply(`You need to wait  \`${jackpotCD}\`  before using this command again`);
        }

        if(!gambleAmount || gambleAmount < 100){
            return message.reply(`Please specify an amount of atleast ${app.common.formatNumber(100)} to gamble!`);
        }

        if(!await app.player.hasMoney(message.author.id, gambleAmount)){
            return message.reply(`You don't have that much money! You currently have ${app.common.formatNumber(row.money)}`);
        }
        
        if(gambleAmount > 50000){
            return message.reply(`Woah there high roller, you cannot gamble more than ${app.common.formatNumber(50000)} on jackpot.`);
        }

        // Check if there's already an active jackpot in the server.
        if(app.sets.jackpotServers.has(message.guild.id)){
            // jackpot active
            return message.reply('There is already an active jackpot in this server.');
        }
        const botMessage = message.reply(`You are about to start a server jackpot with an entry of: ${app.common.formatNumber(gambleAmount)}\nAre you sure?`);

        try{
            const result = await app.react.getConfirmation(message.author.id, botMessage, 15000);

            if(result && app.player.hasMoney(message.author.id, gambleAmount) && app.sets.jackpotServers.has(message.guild.id)){
                jackpotObj[message.author.id] = {name: message.author.username, amount: gambleAmount};
                message.channel.send(lang.jackpot[4]);
                message.channel.send(refreshEmbed(jackpotObj, prefix));
                methods.removemoney(message.author.id, gambleAmount);

                await methods.addCD(message.client, {
                    userId: message.author.id,
                    type: 'jackpot',
                    time: config.cooldowns.jackpot * 1000
                });
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
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit("You didn't react in time!");
        }
    },
}

function refreshEmbed(jackpotObj, prefix){
    var usersArr = [];
    var usersChances = [];

    Object.keys(jackpotObj).forEach(user => {
        usersArr.push((jackpotObj[user].name).slice(0, 18).padEnd(20) + methods.formatMoney(jackpotObj[user].amount, true).padEnd(15) + ((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1) + '%');

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
    .addField('💰 Prize pool', '```fix\n' + methods.formatMoney(getJackpotTotal(jackpotObj), true) + '```')
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
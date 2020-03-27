
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
        const row = await app.player.getRow(message.author.id);
        let gambleAmount = app.parse.numbers(message.args)[0];

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
        const botMessage = await message.reply(`You are about to start a server jackpot with an entry of: ${app.common.formatNumber(gambleAmount)}\nAre you sure?`);

        try{
            const result = await app.react.getConfirmation(message.author.id, botMessage, 15000);

            if(result && await app.player.hasMoney(message.author.id, gambleAmount)){
                startJackpot(app, message, gambleAmount);
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

async function startJackpot(app, message, gambleAmount){
    let jackpotObj = {};

    try{
        app.msgCollector.createChannelCollector(message, m => {
            return m.channel.id === message.channel.id &&
            m.content.toLowerCase().startsWith(message.prefix + 'join')
        }, { time: 120000 });

        jackpotObj[message.author.id] = {name: message.author.username, amount: gambleAmount};
        message.channel.createMessage('**A jackpot has started! A winner will be chosen in `2 minutes`**');
        message.channel.createMessage(refreshEmbed(app, jackpotObj, message.prefix));

        await app.player.removeMoney(message.author.id, gambleAmount);
        await app.cd.setCD(message.author.id, 'jackpot', app.config.cooldowns.jackpot * 1000);

        setTimeout(() => {
            message.channel.createMessage(`⏱ **\`1 minute\` remaining to enter the jackpot! Use \`${message.prefix}join <amount>\` to enter!**`);
        }, 60000)

        setTimeout(() => {
            message.channel.createMessage(`⏱ **\`30 seconds\` remaining to enter the jackpot! Use \`${message.prefix}join <amount>\` to enter!**`);
        }, 90000)

        setTimeout(() => {
            message.channel.createMessage(`⏱ **Jackpot ends in... 10**`);
        }, 110000)

        setTimeout(() => {
            message.channel.createMessage(`⏱ **Jackpot ends in... 5**`);
        }, 115000)

        setTimeout(() => {
            message.channel.createMessage(`⏱ **Jackpot ends in... 4**`);
        }, 116000)

        setTimeout(() => {
            message.channel.createMessage(`⏱ **Jackpot ends in... 3**`);
        }, 117000)
        
        setTimeout(() => {
            message.channel.createMessage(`⏱ **Jackpot ends in... 2**`);
        }, 118000)

        setTimeout(() => {
            message.channel.createMessage(`And the winner is...`);
        }, 119000)

        const collector = app.msgCollector.collectors[`${message.channel.id}`].collector;

        collector.on('collect', async m => {
            if(!await app.player.isActive(m.author.id, m.guild.id)) m.channel.createMessage(`Your account is not active in this server! Use \`${message.prefix}play\` to activate it here`);
            const userArgs = m.content.slice(message.prefix.length).split(/ +/).slice(1);
            let gambleAmnt = app.parse.numbers(userArgs)[0];

            console.log(gambleAmnt);
            if(jackpotObj.hasOwnProperty(m.author.id)){
                return m.channel.createMessage('You already entered this jackpot!');
            }
            else if(Object.keys(jackpotObj).length >= 15){
                return m.channel.createMessage('Sorry, this jackpot is full!')
            }
            else if(!gambleAmnt || gambleAmnt < 100){
                return m.channel.createMessage('Please enter an amount of atleast ' + app.common.formatNumber(100));
            }
            else if(!await app.player.hasMoney(m.author.id, gambleAmnt)){
                return m.channel.createMessage('You don\'t have that much money!');
            }
            else if(gambleAmnt > 50000){
                return m.channel.createMessage('You cannot enter more than ' + app.common.formatNumber(50000) + '!');
            }

            jackpotObj[m.author.id] = {name: m.author.username, amount: gambleAmnt};
            await app.player.removeMoney(m.author.id, gambleAmnt);
            m.channel.createMessage(refreshEmbed(app, jackpotObj, message.prefix));
        });

        collector.on('end', async reason => {
            let winnerId = pickWinner(jackpotObj);
            let winAmount = getJackpotTotal(jackpotObj);
            
            await app.player.addMoney(winnerId, winAmount);

            message.channel.createMessage(`**${jackpotObj[winnerId].name}** won the ${app.common.formatNumber(winAmount)} jackpot with a ${(jackpotObj[winnerId].amount / getJackpotTotal(jackpotObj) * 100).toFixed(1)}% chance of winning!`);
        });
    }
    catch(err){
        return message.reply('There is already an active jackpot in this channel.');
    }
}

function refreshEmbed(app, jackpotObj, prefix){
    var usersArr = [];
    var usersChances = [];

    Object.keys(jackpotObj).forEach(user => {
        usersArr.push((jackpotObj[user].name).slice(0, 18).padEnd(20) + app.common.formatNumber(jackpotObj[user].amount, true).padEnd(15) + ((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1) + '%');

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

    const jackpotEmbed = new app.Embed()
    .setColor(14202368)
    .setTitle('JACKPOT - Win it all!')
    .addField('🎟 Current entrants', '```cs\n' + usersArr.join('\n') + '```')
    .addField('💰 Prize pool', '```fix\n' + app.common.formatNumber(getJackpotTotal(jackpotObj), true) + '```')
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

module.exports = {
    name: 'jackpot',
    aliases: [''],
    description: 'Start a jackpot prize pool that other users can enter for a chance to win it all!',
    long: 'Start a server jackpot that lasts 2 minutes! Other players can join the jackpot with the join command. The more you put into the pot, the higher your chance of winning it all.',
    args: {"amount": "Amount of Scrap to gamble."},
    examples: ["jackpot 1000"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const jackpotCD = await app.cd.getCD(message.author.id, 'jackpot');
        const row = await app.player.getRow(message.author.id);
        let gambleAmount = app.parse.numbers(message.args)[0];

        if(!gambleAmount && message.args[0] && message.args[0].toLowerCase() === 'all'){
            gambleAmount = row.scrap >= 100000 ? 100000 : row.scrap;
        }

       if(jackpotCD){
            return message.reply(`You recently started a server jackpot! You can create another in \`${jackpotCD}\`.`);
        }

        if(!gambleAmount || gambleAmount < 100){
            return message.reply(`Please specify an amount of at least ${app.common.formatNumber(100, false, true)} to gamble!`);
        }

        if(!await app.player.hasMoney(message.author.id, gambleAmount)){
            return message.reply(`❌ You don't have that much Scrap! You currently have ${app.common.formatNumber(row.scrap, false, true)}`);
        }
        
        if(gambleAmount > 100000){
            return message.reply(`Woah there high roller, you cannot gamble more than ${app.common.formatNumber(100000, false, true)} on jackpot.`);
        }
        
        const botMessage = await message.reply(`You are about to start a server jackpot with an entry of: ${app.common.formatNumber(gambleAmount, false, true)}\nAre you sure?`);

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
            message.channel.createMessage(`And the winner is...`);
        }, 119000)

        const collector = app.msgCollector.collectors[`${message.channel.id}`].collector;

        collector.on('collect', async m => {
            if(!await app.player.isActive(m.author.id, m.channel.guild.id)) return m.channel.createMessage(`Your account is not active in this server! Use \`${message.prefix}play\` to activate it here`);
            const userArgs = m.content.slice(message.prefix.length).split(/ +/).slice(1);
            const userRow = await app.player.getRow(m.author.id);
            let gambleAmnt = app.parse.numbers(userArgs)[0];

            if(!gambleAmnt && userArgs[0] && userArgs[0].toLowerCase() === 'all'){
                gambleAmnt = userRow.scrap >= 100000 ? 100000 : userRow.scrap;
            }

            if(Object.keys(jackpotObj).length >= 15){
                return m.channel.createMessage('Sorry, this jackpot is full!')
            }
            else if(!gambleAmnt || gambleAmnt < 100){
                return m.channel.createMessage('Please enter an amount of at least ' + app.common.formatNumber(100, false, true));
            }
            else if(gambleAmnt > userRow.money){
                return m.channel.createMessage('❌ You don\'t have that much Scrap! You currently have ' + app.common.formatNumber(userRow.scrap, false, true));
            }
            else if(gambleAmnt > 100000){
                return m.channel.createMessage('❌ You cannot enter more than ' + app.common.formatNumber(100000, false, true) + '!');
            }
            else if(jackpotObj.hasOwnProperty(m.author.id) && (gambleAmnt + jackpotObj[m.author.id].amount) > 100000){
                return m.channel.createMessage('❌ Adding ' + app.common.formatNumber(gambleAmnt, false, true) + ' would put your entry over the ' + app.common.formatNumber(100000, false, true) + ' entry limit!');
            }

            if(jackpotObj.hasOwnProperty(m.author.id)){
                jackpotObj[m.author.id] = {
                    name: m.author.username, 
                    amount: gambleAmnt + jackpotObj[m.author.id].amount
                };
            }
            else{
                jackpotObj[m.author.id] = {
                    name: m.author.username, 
                    amount: gambleAmnt
                };
            }
            
            await app.player.removeMoney(m.author.id, gambleAmnt);
            m.channel.createMessage(refreshEmbed(app, jackpotObj, message.prefix));
        });

        collector.on('end', async reason => {
            let winnerId = pickWinner(jackpotObj);
            let winAmount = getJackpotTotal(jackpotObj);
            
            await app.player.addScrap(winnerId, winAmount);

            message.channel.createMessage(`**${jackpotObj[winnerId].name}** won the ${app.common.formatNumber(winAmount, false, true)} jackpot with a ${(jackpotObj[winnerId].amount / getJackpotTotal(jackpotObj) * 100).toFixed(1)}% chance of winning!`);
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

    usersArr.unshift(('Player').padEnd(22) + 'Bet (Scrap)'.padEnd(15) + 'Chance');

    const jackpotEmbed = new app.Embed()
    .setColor(13451564)
    .setTitle('Jackpot - Win it all!')
    .setDescription('Enter or add to your current bet with `' + prefix + 'join <amount>`.')
    .addField('Current entrants', '```cs\n' + usersArr.join('\n') + '```')
    .addField('Prize pool', app.common.formatNumber(getJackpotTotal(jackpotObj), false, true))
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
const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const suits = ['♥', '♠', '♦', '♣'];
const faces = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q'];

module.exports = {
    name: 'blackjack',
    aliases: [''],
    description: 'Play a game of blackjack, get a higher total than the dealer without busting and you win!',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var gambleAmount = args[0];

        if(message.client.restartLockdown){
            return message.reply('The blackjack command has been disabled to prevent issues caused by a bot update! Should be back soon...');
        }

        if(gambleAmount !== undefined && gambleAmount >= 100){
            gambleAmount = Math.floor(gambleAmount);
        }
        else{
            return message.reply(lang.jackpot[1]);
        }
        
        const hasMoney = await methods.hasmoney(message.author.id, gambleAmount);

        if(!hasMoney){
            return message.reply(lang.buy[4]);
        }
        else if(gambleAmount > 50000){
            return message.reply(lang.jackpot[2]);
        }
        else if(message.client.sets.gambleCooldown.has(message.author.id)){
            const timeRow = await query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`);
            return message.reply(lang.general[10].replace('{0}', ((60 * 1000 - ((new Date()).getTime() - timeRow[0].gambleTime)) / 1000).toFixed(0)));
        }
        else{
            var deck = initDeck();
            var playerCards = [];
            var dealerCards = [];
            var playerFinal = 0;
            var dealerFinal = 0;

            for(var i = 0; i < 2; i++){
                playerCards.push(drawCard(deck));
            }
            dealerCards.push(drawCard(deck));

            methods.removemoney(message.author.id, gambleAmount)
            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.gambleCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET gambleTime = ${0} WHERE userId = ${message.author.id}`);
            }, 60 * 1000);
            
            message.client.shard.broadcastEval(`this.sets.gambleCooldown.add('${message.author.id}')`);
            query(`UPDATE cooldowns SET gambleTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);

            message.channel.send(genEmbed(message, playerCards, dealerCards, gambleAmount));

            const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id, { time: 60000 });

            collector.on('collect', response => {
                if(response.content.toLowerCase().startsWith('hit')){
                    playerCards.push(drawCard(deck));

                    let playerScore = getScore(playerCards);
                    if(playerScore.minScore > 21){
                        // busted
                        collector.stop('work?');
                        
                        message.channel.send(loserEmbed(message, playerCards, dealerCards, 'You busted and lost ' + methods.formatMoney(gambleAmount), gambleAmount));
                    }
                    else{
                        message.channel.send(genEmbed(message, playerCards, dealerCards, gambleAmount));
                    }
                }
                else if(response.content.toLowerCase().startsWith('stand')){
                    collector.stop();

                    let playerScore = getScore(playerCards);
                    if(playerScore.score > 21){
                        playerFinal = playerScore.minScore;
                    }
                    else{
                        playerFinal = playerScore.score;
                    }

                    while(getScore(dealerCards).minScore < 17){
                        dealerCards.push(drawCard(deck));

                        if(getScore(dealerCards).score > 17 && getScore(dealerCards).score <= 21){
                            dealerFinal = getScore(dealerCards).score;
                            break;
                        }

                        dealerFinal = getScore(dealerCards).minScore;
                    }


                    if(dealerFinal > 21){
                        message.channel.send(winnerEmbed(message, playerCards, dealerCards, 'The dealer busted! You won ' + methods.formatMoney(gambleAmount), gambleAmount));
                    }
                    else if(playerFinal > dealerFinal){
                        message.channel.send(winnerEmbed(message, playerCards, dealerCards, 'you won ' + methods.formatMoney(gambleAmount), gambleAmount));
                    }
                    else if(playerFinal < dealerFinal){
                        message.channel.send(loserEmbed(message, playerCards, dealerCards, 'you lost ' + methods.formatMoney(gambleAmount), gambleAmount));
                    }
                    else{ // player and dealer tied...
                        message.channel.send(tieEmbed(message, playerCards, dealerCards, 'tied with dealer (You lose $0)', gambleAmount));
                    }
                }
            });
            collector.on('end', (response, reason) => {
                if(reason == 'time'){
                    methods.addmoney(message.author.id, gambleAmount);
                }
            });
        }
    },
}

function drawCard(deck){
    var index = Math.floor(Math.random() * deck.length);
    var card = deck[index];
    deck.splice(index, 1); // Removes card from original array

    return card;
}

function initDeck(){
    var deck = [];

    for(var i = 0; i < suits.length; i++){
        for(var i2 = 0; i2 < faces.length; i2++){
            var tmpVal;

            if(faces[i2] == 'J' || faces[i2] == 'Q' || faces[i2] == 'K'){
                tmpVal = 10;
            }
            else if(faces[i2] == 'A'){
                tmpVal = 11;
            }
            else{
                tmpVal = parseInt(faces[i2]);
            }

            var card = {face: faces[i2], suit: suits[i], value: tmpVal, display: faces[i2] + suits[i]};

            deck.push(card);
        }
    }
    
    return deck;
}

function getScore(playersHand){
    var score = 0;
    var minScore = 0; // Used if player has aces...

    for(var i = 0; i < playersHand.length; i++){
        if(playersHand[i].face == 'A'){
            minScore -= 10;
        }

        score += playersHand[i].value;
        minScore += playersHand[i].value;
    }

    return {score: score, minScore: minScore};
}

function hasAce(playersHand){
    for(var i = 0; i < playersHand.length; i++){
        if(playersHand[i].face == 'A'){
            return true;
        }
    }

    return false;
}

function genEmbed(message, playerCards, dealerCards, gambleAmount, dealerEmote = '<:ez:625030742296100902>'){
    playerVal = getScore(playerCards);
    dealerVal = getScore(dealerCards);
    playerString = '';
    dealerString = '';

    for(var i = 0; i < playerCards.length; i++){
        playerString += playerCards[i].display;
    }
    for(var i = 0; i < dealerCards.length; i++){
        dealerString += dealerCards[i].display;
    }

    console.log(gambleAmount);
    const embed = new Discord.RichEmbed()
    .setAuthor(methods.formatMoney(gambleAmount, true) + ' BLACKJACK GAME', message.author.avatarURL)
    .addField(message.author.username + ` - **${hasAce(playerCards) && playerVal.score <= 21 ? playerVal.score + '/' + playerVal.minScore : playerVal.minScore}**`, playerString, true)
    .addField(`${dealerEmote} Dealer - **${dealerVal.score > 21 ? dealerVal.minScore : dealerVal.score}**`, dealerString, true)
    .setFooter('Options: hit, stand')
    .setColor(13215302)

    return embed;
}

function winnerEmbed(message, playerCards, dealerCards, quote, gambleAmount){
    const embed = genEmbed(message, playerCards, dealerCards, gambleAmount, '<:iamlose:625031548961292349>');

    embed.setDescription(quote);
    embed.setColor(720640);
    methods.addmoney(message.author.id, gambleAmount * 2);

    return embed;
}

function loserEmbed(message, playerCards, dealerCards, quote, gambleAmount){
    const embed = genEmbed(message, playerCards, dealerCards, gambleAmount, '<:OHNONO:625030797375832133>');

    embed.setDescription(quote);
    embed.setColor(13632027);

    return embed;
}

function tieEmbed(message, playerCards, dealerCards, quote, gambleAmount){
    const embed = genEmbed(message, playerCards, dealerCards, gambleAmount, '<:iamlose:625031548961292349>');

    embed.setDescription(quote);
    embed.setColor(10395294);
    methods.addmoney(message.author.id, gambleAmount);

    return embed;
}
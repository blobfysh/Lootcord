const suits = ['♥', '♠', '♦', '♣'];
const faces = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q'];

module.exports = {
    name: 'blackjack',
    aliases: ['bj'],
    description: 'Play a game of blackjack, get a higher total than the dealer without busting and you win!',
    long: 'Play a game of blackjack. Type hit to draw a random card from the deck or type stand to stop drawing cards and see if the dealer gets closer to 21 than you. Whoever gets closer to 21 without going over, wins!',
    args: {"amount": "Amount of money to gamble."},
    examples: ["blackjack 1000"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const blackjackCD = await app.cd.getCD(message.author.id, 'blackjack');
        let gambleAmount = app.parse.numbers(message.args)[0];

        if(blackjackCD){
            return message.reply(`You need to wait \`${blackjackCD}\` before playing another game of blackjack.`);
        }

        if(!gambleAmount || gambleAmount < 100){
            return message.reply(`Please specify an amount of atleast ${app.common.formatNumber(100)} to gamble!`);
        }

        if(gambleAmount > row.money){
            return message.reply(`You don't have that much money! You currently have ${app.common.formatNumber(row.money)}`);
        }
        
        if(gambleAmount > 1000000){
            return message.reply(`Woah there high roller, you cannot gamble more than ${app.common.formatNumber(1000000)} on blackjack.`);
        }

        try{
            // try to create collector first so that it can error out before removing player money and adding cooldown
            app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => {
                return m.author.id === message.author.id
            }, { time: 60000 });

            var deck = initDeck();
            var playerCards = [];
            var dealerCards = [];
            var playerFinal = 0;
            var dealerFinal = 0;

            for(var i = 0; i < 2; i++){
                playerCards.push(drawCard(deck));
            }
            dealerCards.push(drawCard(deck));

            await app.player.removeMoney(message.author.id, gambleAmount);
            await app.cd.setCD(message.author.id, 'blackjack', app.config.cooldowns.blackjack * 1000);

            message.channel.createMessage(genEmbed(app, message, playerCards, dealerCards, gambleAmount));

            const collector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;

            collector.on('collect', m => {
                if(m.content.toLowerCase().startsWith('hit')){
                    // hit
                    playerCards.push(drawCard(deck));

                    let playerScore = getScore(playerCards);
                    if(playerScore.minScore > 21){
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);

                        message.channel.createMessage(loserEmbed(app, message, playerCards, dealerCards, 'You busted and lost ' + app.common.formatNumber(gambleAmount), gambleAmount));
                    }
                    else{
                        message.channel.createMessage(genEmbed(app, message, playerCards, dealerCards, gambleAmount));
                    }
                }
                else if(m.content.toLowerCase().startsWith('stand')){
                    app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);

                    let playerScore = getScore(playerCards);
                    if(playerScore.score > 21){
                        playerFinal = playerScore.minScore;
                    }
                    else{
                        playerFinal = playerScore.score;
                    }

                    // dealer draws card while below 17
                    while(getScore(dealerCards).minScore < 17){
                        dealerCards.push(drawCard(deck));
    
                        if(getScore(dealerCards).score > 17 && getScore(dealerCards).score <= 21){
                            dealerFinal = getScore(dealerCards).score;
                            break;
                        }
    
                        dealerFinal = getScore(dealerCards).minScore;
                    }

                    if(dealerFinal > 21){
                        message.channel.createMessage(winnerEmbed(app, message, playerCards, dealerCards, 'The dealer busted! You won ' + app.common.formatNumber(gambleAmount), gambleAmount));
                    }
                    else if(playerFinal > dealerFinal){
                        message.channel.createMessage(winnerEmbed(app, message, playerCards, dealerCards, 'you won ' + app.common.formatNumber(gambleAmount), gambleAmount));
                    }
                    else if(playerFinal < dealerFinal){
                        message.channel.createMessage(loserEmbed(app, message, playerCards, dealerCards, 'you lost ' + app.common.formatNumber(gambleAmount), gambleAmount));
                    }
                    else{ // player and dealer tied...
                        message.channel.createMessage(tieEmbed(app, message, playerCards, dealerCards, `tied with dealer (You lose ${app.common.formatNumber(0)})`, gambleAmount));
                    }
                }
            });
            collector.on('end', reason => {
                if(reason === 'time'){
                    app.player.addMoney(message.author.id, gambleAmount);
                }
            });
        }
        catch(err){
            return message.reply('You have an active command running!');
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

function genEmbed(app, message, playerCards, dealerCards, gambleAmount, dealerEmote = app.icons.blackjack_dealer_neutral){
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

    const embed = new app.Embed()
    .setAuthor('Blackjack', message.author.avatarURL)
    .setDescription('Type `hit` to draw another card or `stand` to pass.')
    .addField('Bet: ', app.common.formatNumber(gambleAmount))
    .addBlankField()
    .addField(message.author.username + ` - **${hasAce(playerCards) && playerVal.score <= 21 ? playerVal.score + '/' + playerVal.minScore : playerVal.minScore}**`, playerString)
    .addField(`${dealerEmote} Dealer - **${dealerVal.score > 21 ? dealerVal.minScore : dealerVal.score}**`, dealerString)
    .setColor(13215302)

    return embed;
}

function winnerEmbed(app, message, playerCards, dealerCards, quote, gambleAmount){
    const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_lost);

    embed.setDescription(quote);
    embed.setColor(720640);
    app.player.addMoney(message.author.id, gambleAmount * 2);

    if(gambleAmount * 2 >= 2000000){
        app.itm.addBadge(message.author.id, 'gambler');
    }

    return embed;
}

function loserEmbed(app, message, playerCards, dealerCards, quote, gambleAmount){
    const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_won);

    embed.setDescription(quote);
    embed.setColor(13632027);

    return embed;
}

function tieEmbed(app, message, playerCards, dealerCards, quote, gambleAmount){
    const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_lost);

    embed.setDescription(quote);
    embed.setColor(10395294);
    app.player.addMoney(message.author.id, gambleAmount);

    return embed;
}
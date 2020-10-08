const suits = ['♥', '♠', '♦', '♣']
const faces = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q']

module.exports = {
	name: 'blackjack',
	aliases: ['bj'],
	description: 'Play a game of blackjack, get a higher total than the dealer without busting and you win!',
	long: 'Play a game of blackjack. Type hit to draw a random card from the deck or type stand to stop drawing cards and see if the dealer gets closer to 21 than you. Whoever gets closer to 21 without going over, wins!',
	args: { amount: 'Amount of Scrap to gamble.' },
	examples: ['blackjack 1000'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const row = await app.player.getRow(message.author.id)
		const blackjackCD = await app.cd.getCD(message.author.id, 'blackjack')
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.scrap >= 1000000 ? 1000000 : row.scrap
		}

		if (blackjackCD) {
			return message.reply(`You need to wait \`${blackjackCD}\` before playing another game of blackjack.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return message.reply(`Please specify an amount of at least **${app.common.formatNumber(100, false, true)}** to gamble!`)
		}

		if (gambleAmount > row.scrap) {
			return message.reply(`❌ You don't have that much Scrap! You currently have **${app.common.formatNumber(row.scrap, false, true)}**. You can trade your ${app.icons.money} Lootcoin for ${app.icons.scrap} Scrap: \`${prefix}buy scrap <amount>\``)
		}

		if (gambleAmount > 1000000) {
			return message.reply(`Woah there high roller, you cannot gamble more than **${app.common.formatNumber(1000000, false, true)}** on blackjack.`)
		}

		try {
			// try to create collector first so that it can error out before removing player money and adding cooldown
			const collectorObj = app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => m.author.id === message.author.id, { time: 60000 })

			const deck = initDeck()
			const playerCards = []
			const dealerCards = []
			let playerFinal = 0
			let dealerFinal = 0

			for (let i = 0; i < 2; i++) {
				playerCards.push(drawCard(deck))
			}
			dealerCards.push(drawCard(deck))

			await app.player.removeScrap(message.author.id, gambleAmount)
			await app.cd.setCD(message.author.id, 'blackjack', app.config.cooldowns.blackjack * 1000)

			message.channel.createMessage(genEmbed(app, message, playerCards, dealerCards, gambleAmount))

			collectorObj.collector.on('collect', m => {
				if (m.content.toLowerCase().startsWith('hit')) {
					// hit
					playerCards.push(drawCard(deck))

					const playerScore = getScore(playerCards)
					if (playerScore.minScore > 21) {
						app.msgCollector.stopCollector(collectorObj)

						message.channel.createMessage(loserEmbed(app, message, playerCards, dealerCards, `You busted and lost **${app.common.formatNumber(gambleAmount, false, true)}**...`, gambleAmount))
					}
					else {
						message.channel.createMessage(genEmbed(app, message, playerCards, dealerCards, gambleAmount))
					}
				}
				else if (m.content.toLowerCase().startsWith('stand')) {
					app.msgCollector.stopCollector(collectorObj)

					const playerScore = getScore(playerCards)
					if (playerScore.score > 21) {
						playerFinal = playerScore.minScore
					}
					else {
						playerFinal = playerScore.score
					}

					// dealer draws card while below 17
					while (getScore(dealerCards).minScore < 17) {
						dealerCards.push(drawCard(deck))

						if (getScore(dealerCards).score > 17 && getScore(dealerCards).score <= 21) {
							dealerFinal = getScore(dealerCards).score
							break
						}

						dealerFinal = getScore(dealerCards).minScore
					}

					if (dealerFinal > 21) {
						message.channel.createMessage(winnerEmbed(app, message, playerCards, dealerCards, `The dealer busted! You won **${app.common.formatNumber(gambleAmount * 2, false, true)}**`, gambleAmount))
					}
					else if (playerFinal > dealerFinal) {
						message.channel.createMessage(winnerEmbed(app, message, playerCards, dealerCards, `You won **${app.common.formatNumber(gambleAmount * 2, false, true)}**!`, gambleAmount))
					}
					else if (playerFinal < dealerFinal) {
						message.channel.createMessage(loserEmbed(app, message, playerCards, dealerCards, `You lost **${app.common.formatNumber(gambleAmount, false, true)}**...`, gambleAmount))
					}
					else { // player and dealer tied...
						message.channel.createMessage(tieEmbed(app, message, playerCards, dealerCards, `Tied with dealer (You lose **${app.common.formatNumber(0, false, true)}**)`, gambleAmount))
					}
				}
			})
			collectorObj.collector.on('end', reason => {
				if (reason === 'time') {
					message.reply('**You took too long to make a decision!** Your game of blackjack has expired.')
				}
			})
		}
		catch (err) {
			return message.reply('You have an active command running!')
		}
	}
}

function drawCard(deck) {
	const index = Math.floor(Math.random() * deck.length)
	const card = deck[index]
	deck.splice(index, 1) // Removes card from original array

	return card
}

function initDeck() {
	const deck = []

	for (let i = 0; i < suits.length; i++) {
		for (let i2 = 0; i2 < faces.length; i2++) {
			let tmpVal

			if (faces[i2] === 'J' || faces[i2] === 'Q' || faces[i2] === 'K') {
				tmpVal = 10
			}
			else if (faces[i2] === 'A') {
				tmpVal = 11
			}
			else {
				tmpVal = parseInt(faces[i2])
			}

			const card = { face: faces[i2], suit: suits[i], value: tmpVal, display: faces[i2] + suits[i] }

			deck.push(card)
		}
	}

	return deck
}

function getScore(playersHand) {
	let score = 0
	let minScore = 0 // Used if player has aces...

	for (let i = 0; i < playersHand.length; i++) {
		if (playersHand[i].face === 'A') {
			minScore -= 10
		}

		score += playersHand[i].value
		minScore += playersHand[i].value
	}

	return { score, minScore }
}

function hasAce(playersHand) {
	for (let i = 0; i < playersHand.length; i++) {
		if (playersHand[i].face === 'A') {
			return true
		}
	}

	return false
}

function genEmbed(app, message, playerCards, dealerCards, gambleAmount, dealerEmote = app.icons.blackjack_dealer_neutral) {
	const playerVal = getScore(playerCards)
	const dealerVal = getScore(dealerCards)
	let playerString = ''
	let dealerString = ''

	for (let i = 0; i < playerCards.length; i++) {
		playerString += playerCards[i].display
	}
	for (let i = 0; i < dealerCards.length; i++) {
		dealerString += dealerCards[i].display
	}

	const embed = new app.Embed()
		.setAuthor('Blackjack', message.author.avatarURL)
		.setDescription('Type `hit` to draw another card or `stand` to pass.')
		.addField('Bet: ', app.common.formatNumber(gambleAmount, false, true))
		.addBlankField()
		.addField(`${message.author.username} - **${hasAce(playerCards) && playerVal.score <= 21 ? `${playerVal.score}/${playerVal.minScore}` : playerVal.minScore}**`, playerString)
		.addField(`${dealerEmote} Dealer - **${dealerVal.score > 21 ? dealerVal.minScore : dealerVal.score}**`, dealerString)
		.setFooter('You have 60 seconds to finish this game.')
		.setColor('#9449d6')

	return embed
}

function winnerEmbed(app, message, playerCards, dealerCards, quote, gambleAmount) {
	const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_lost)

	embed.setDescription(quote)
	embed.setColor(720640)
	embed.embed.footer = undefined
	app.player.addScrap(message.author.id, gambleAmount * 2)

	if (gambleAmount * 2 >= 2000000) {
		app.itm.addBadge(message.author.id, 'gambler')
	}

	return embed
}

function loserEmbed(app, message, playerCards, dealerCards, quote, gambleAmount) {
	const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_won)

	embed.setDescription(quote)
	embed.setColor(13632027)
	embed.embed.footer = undefined

	return embed
}

function tieEmbed(app, message, playerCards, dealerCards, quote, gambleAmount) {
	const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_lost)

	embed.setDescription(quote)
	embed.setColor(10395294)
	embed.embed.footer = undefined
	app.player.addScrap(message.author.id, gambleAmount)

	return embed
}

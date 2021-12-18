const suits = ['♥', '♠', '♦', '♣']
const faces = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q']
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'blackjack',
	aliases: ['bj'],
	description: 'Play a game of blackjack, get a higher total than the dealer without busting and you win!',
	long: 'Play a game of blackjack. Click hit to draw a random card from the deck or click stand to stop drawing cards and see if the dealer gets closer to 21 than you. Whoever gets closer to 21 without going over, wins!',
	args: { amount: 'Amount of scrap to gamble.' },
	examples: ['blackjack 1000'],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const blackjackCD = await app.cd.getCD(message.author.id, 'blackjack', { serverSideGuildId })
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.money >= 50000 ? 50000 : row.money
		}

		if (blackjackCD) {
			return reply(message, `You need to wait \`${blackjackCD}\` before playing another game of blackjack.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return reply(message, `Please specify an amount of at least **${app.common.formatNumber(100)}** to gamble!`)
		}

		if (gambleAmount > row.money) {
			return reply(message, `❌ You don't have that much scrap! You currently have **${app.common.formatNumber(row.money)}**.`)
		}

		if (gambleAmount > 50000) {
			return reply(message, `Woah there high roller, you cannot gamble more than **${app.common.formatNumber(50000)}** on blackjack.`)
		}

		const deck = initDeck()
		const playerCards = []
		const dealerCards = []
		let playerFinal = 0
		let dealerFinal = 0

		playerCards.push(drawCard(deck), drawCard(deck))
		dealerCards.push(drawCard(deck))

		await app.player.removeMoney(message.author.id, gambleAmount, serverSideGuildId)
		await app.cd.setCD(message.author.id, 'blackjack', app.config.cooldowns.blackjack * 1000, { serverSideGuildId })


		const botMessage = await reply(message, {
			embed: genEmbed(app, message, playerCards, dealerCards, gambleAmount).embed,
			components: [{
				type: 1,
				components: [
					{
						type: 2,
						label: 'Hit',
						custom_id: 'hit',
						style: 2
					},
					{
						type: 2,
						label: 'Stand',
						custom_id: 'stand',
						style: 2
					}
				]
			}]
		})

		const { collector, stopCollector } = app.btnCollector.createCollector(botMessage.id, i => i.user.id === message.author.id, { time: 60000 })

		collector.on('collect', async i => {
			if (i.customID === 'hit') {
				// hit
				playerCards.push(drawCard(deck))

				const playerScore = getScore(playerCards)
				if (playerScore.minScore > 21) {
					stopCollector()

					await app.player.addStat(message.author.id, 'gamblingLost', gambleAmount, serverSideGuildId)

					await i.respond({
						embeds: [loserEmbed(app, message, playerCards, dealerCards, `You busted and lost **${app.common.formatNumber(gambleAmount)}**...`, gambleAmount).embed],
						components: []
					})
				}
				else {
					await i.respond({
						embeds: [genEmbed(app, message, playerCards, dealerCards, gambleAmount).embed]
					})
				}
			}
			else if (i.customID === 'stand') {
				stopCollector()

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

					const dealerScore = getScore(dealerCards)

					if (dealerScore.score > 17 && dealerScore.score <= 21) {
						dealerFinal = dealerScore.score
						break
					}

					dealerFinal = dealerScore.minScore
				}

				if (dealerFinal > 21) {
					await userWon()

					await i.respond({
						embeds: [winnerEmbed(app, message, playerCards, dealerCards, `The dealer busted! You won **${app.common.formatNumber(gambleAmount * 2)}**`, gambleAmount).embed],
						components: []
					})
				}
				else if (playerFinal > dealerFinal) {
					await userWon()

					await i.respond({
						embeds: [winnerEmbed(app, message, playerCards, dealerCards, `You won **${app.common.formatNumber(gambleAmount * 2)}**!`, gambleAmount).embed],
						components: []
					})
				}
				else if (playerFinal < dealerFinal) {
					await app.player.addStat(message.author.id, 'gamblingLost', gambleAmount, serverSideGuildId)

					await i.respond({
						embeds: [loserEmbed(app, message, playerCards, dealerCards, `You lost **${app.common.formatNumber(gambleAmount)}**...`, gambleAmount).embed],
						components: []
					})
				}
				else { // player and dealer tied...
					await app.player.addMoney(message.author.id, gambleAmount, serverSideGuildId)

					await i.respond({
						embeds: [tieEmbed(app, message, playerCards, dealerCards, `Tied with dealer (You lose **${app.common.formatNumber(0)}**)`, gambleAmount).embed],
						components: []
					})
				}
			}
		})

		collector.on('end', reason => {
			if (reason === 'time') {
				const errorEmbed = new app.Embed()
					.setColor(16734296)
					.setDescription('❌ **You ran out of time!** Your game of blackjack has expired.')

				botMessage.edit({
					embed: errorEmbed.embed,
					components: []
				})
			}
		})

		async function userWon () {
			await app.player.addMoney(message.author.id, gambleAmount * 2, serverSideGuildId)
			await app.player.addStat(message.author.id, 'gamblingWon', gambleAmount, serverSideGuildId)

			if (gambleAmount * 2 >= 100000) {
				await app.itm.addBadge(message.author.id, 'gambler', serverSideGuildId)
			}
		}
	}
}

function drawCard (deck) {
	const index = Math.floor(Math.random() * deck.length)
	const card = deck[index]
	deck.splice(index, 1) // Removes card from original array

	return card
}

function initDeck () {
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

function getScore (playersHand) {
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

function hasAce (playersHand) {
	for (let i = 0; i < playersHand.length; i++) {
		if (playersHand[i].face === 'A') {
			return true
		}
	}

	return false
}

function genEmbed (app, message, playerCards, dealerCards, gambleAmount, dealerEmote = app.icons.blackjack_dealer_neutral) {
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
		.addField('Bet: ', app.common.formatNumber(gambleAmount))
		.addBlankField()
		.addField(`${message.author.username} - **${hasAce(playerCards) && playerVal.score <= 21 ? `${playerVal.score}/${playerVal.minScore}` : playerVal.minScore}**`, playerString)
		.addField(`${dealerEmote} Dealer - **${dealerVal.score > 21 ? dealerVal.minScore : dealerVal.score}**`, dealerString)
		.setFooter('You have 60 seconds to finish this game.')
		.setColor('#ADADAD')

	return embed
}

function winnerEmbed (app, message, playerCards, dealerCards, quote, gambleAmount) {
	const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_lost)

	embed.setDescription(quote)
	embed.setColor(720640)
	embed.embed.footer = undefined

	return embed
}

function loserEmbed (app, message, playerCards, dealerCards, quote, gambleAmount) {
	const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_won)

	embed.setDescription(quote)
	embed.setColor(16734296)
	embed.embed.footer = undefined

	return embed
}

function tieEmbed (app, message, playerCards, dealerCards, quote, gambleAmount) {
	const embed = genEmbed(app, message, playerCards, dealerCards, gambleAmount, app.icons.blackjack_dealer_lost)

	embed.setDescription(quote)
	embed.setColor(10395294)
	embed.embed.footer = undefined

	return embed
}

const { reply } = require('../../utils/messageUtils')

const WIN_QUOTES = [
	'You chose **{choice}** and the coin landed on **{side}**\n\nYou just won **{bet}**!',
	'You chose **{choice}** and the coin landed on **{side}**\n\nWow you\'re pretty good at flipping this coin 👀 You won **{bet}**!',
	'You chose **{choice}** and the coin landed on **{side}**\n\nCongratulations! You just won **{bet}**!'
]
const LOSE_QUOTES = [
	'You chose **{choice}** but the coin landed on **{side}**\n\nYou just lost **{bet}**!',
	'You chose **{choice}** but the coin landed on **{side}**\n\nCongratulations! You just lost **{bet}**!'
]

exports.command = {
	name: 'coinflip',
	aliases: ['cf'],
	description: 'Flip a coin for a chance to win!',
	long: 'Flip a coin for a chance to win 2x what you bet!',
	args: {
		choice: 'heads/tails',
		amount: 'Amount of scrap to gamble.'
	},
	examples: ['cf heads 1000', 'cf t 1000'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,


	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const coinflipCD = await app.cd.getCD(message.author.id, 'coinflip', { serverSideGuildId })
		const choice = getSide(args)
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && ((args[0] && args[0].toLowerCase() === 'all') || (args[1] && args[1].toLowerCase() === 'all'))) {
			gambleAmount = row.money >= 50000 ? 50000 : row.money
		}

		if (coinflipCD) {
			return reply(message, `You need to wait \`${coinflipCD}\` before flipping another coin.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return reply(message, `Please specify an amount of at least **${app.common.formatNumber(100)}** to gamble!`)
		}

		if (gambleAmount > row.money) {
			return reply(message, `❌ You don't have that much scrap! You currently have **${app.common.formatNumber(row.money)}**.`)
		}

		if (gambleAmount > 50000) {
			return reply(message, `Woah there high roller, you cannot gamble more than **${app.common.formatNumber(50000)}** on coinflip.`)
		}


		if (Math.random() < 0.44) {
			await app.player.addMoney(message.author.id, gambleAmount, serverSideGuildId)
			await app.player.addStat(message.author.id, 'gamblingWon', gambleAmount, serverSideGuildId)

			if (gambleAmount >= 50000) {
				await app.itm.addBadge(message.author.id, 'gambler', serverSideGuildId)
			}

			await reply(message, WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)]
				.replace('{bet}', app.common.formatNumber(gambleAmount * 2))
				.replace('{choice}', choice)
				.replace('{side}', choice)
			)
		}
		else {
			await app.player.removeMoney(message.author.id, gambleAmount, serverSideGuildId)
			await app.player.addStat(message.author.id, 'gamblingLost', gambleAmount, serverSideGuildId)

			await reply(message, LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)]
				.replace('{bet}', app.common.formatNumber(gambleAmount))
				.replace('{choice}', choice)
				.replace('{side}', choice === 'heads' ? 'tails' : 'heads')
			)
		}

		await app.cd.setCD(message.author.id, 'coinflip', app.config.cooldowns.coinflip * 1000, { serverSideGuildId })
	}
}

function getSide (args) {
	if (args.some(arg => ['heads', 'h'].includes(arg))) {
		return 'heads'
	}
	else if (args.some(arg => ['tails', 't'].includes(arg))) {
		return 'tails'
	}

	// default to heads if no choice specified
	return 'heads'
}

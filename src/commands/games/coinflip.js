const WIN_QUOTES = ['You just won **{0}**!', 'Wow you\'re pretty good at flipping this coin 👀 You won **{0}**!', 'Congratulations! You just won **{0}**!']
const LOSE_QUOTES = ['You just lost **{0}**!', 'Congratulations! You just lost **{0}**!']

exports.command = {
	name: 'coinflip',
	aliases: ['cf'],
	description: 'Flip a coin for a chance to win!',
	long: 'Flip a coin for a chance to win 2x what you bet!',
	args: { amount: 'Amount of scrap to gamble.' },
	examples: ['cf 1000'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,


	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const coinflipCD = await app.cd.getCD(message.author.id, 'coinflip', { serverSideGuildId })
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.money >= 50000 ? 50000 : row.money
		}

		if (coinflipCD) {
			return message.reply(`You need to wait \`${coinflipCD}\` before flipping another coin.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return message.reply(`Please specify an amount of at least **${app.common.formatNumber(100)}** to gamble!`)
		}

		if (gambleAmount > row.money) {
			return message.reply(`❌ You don't have that much scrap! You currently have **${app.common.formatNumber(row.money)}**.`)
		}

		if (gambleAmount > 50000) {
			return message.reply(`Woah there high roller, you cannot gamble more than **${app.common.formatNumber(50000)}** on coinflip.`)
		}


		if (Math.random() < 0.4) {
			await app.player.addMoney(message.author.id, gambleAmount, serverSideGuildId)

			if (gambleAmount >= 50000) {
				await app.itm.addBadge(message.author.id, 'gambler', serverSideGuildId)
			}

			message.reply(WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount * 2)))
		}
		else {
			await app.player.removeMoney(message.author.id, gambleAmount, serverSideGuildId)
			message.reply(LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount)))
		}

		await app.cd.setCD(message.author.id, 'coinflip', app.config.cooldowns.coinflip * 1000, { serverSideGuildId })
	}
}

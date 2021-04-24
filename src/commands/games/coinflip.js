const WIN_QUOTES = ['You just won **{0}**!', 'Wow you\'re pretty good at flipping this coin 👀 You won **{0}**!', 'Congratulations! You just won **{0}**!']
const LOSE_QUOTES = ['You just lost **{0}**!', 'Congratulations! You just lost **{0}**!']

module.exports = {
	name: 'coinflip',
	aliases: ['cf'],
	description: 'Flip a coin for a chance to win!',
	long: 'Gamble your Scrap for a 50% chance of winning 2x what you bet!',
	args: { amount: 'Amount of Scrap to gamble.' },
	examples: ['cf 1000'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,


	async execute(app, message, { args, prefix, guildInfo }) {
		const row = await app.player.getRow(message.author.id)
		const coinflipCD = await app.cd.getCD(message.author.id, 'coinflip')
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.scrap >= 1000000 ? 1000000 : row.scrap
		}

		if (coinflipCD) {
			return message.reply(`You need to wait \`${coinflipCD}\` before flipping another coin.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return message.reply(`Please specify an amount of at least **${app.common.formatNumber(100, false, true)}** to gamble!`)
		}

		if (gambleAmount > row.scrap) {
			return message.reply(`❌ You don't have that much Scrap! You currently have **${app.common.formatNumber(row.scrap, false, true)}**. You can trade your ${app.icons.money} Lootcoin for ${app.icons.scrap} Scrap: \`${prefix}buy scrap <amount>\``)
		}

		if (gambleAmount > 1000000) {
			return message.reply(`Woah there high roller, you cannot gamble more than **${app.common.formatNumber(1000000, false, true)}** on coinflip.`)
		}


		if (Math.random() < 0.5) {
			await app.player.addScrap(message.author.id, gambleAmount)

			if (gambleAmount >= 1000000) {
				await app.itm.addBadge(message.author.id, 'gambler')
			}

			message.reply(WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount * 2, false, true)))
		}
		else {
			await app.player.removeScrap(message.author.id, gambleAmount)
			message.reply(LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount, false, true)))
		}

		await app.cd.setCD(message.author.id, 'coinflip', app.config.cooldowns.coinflip * 1000)
	}
}

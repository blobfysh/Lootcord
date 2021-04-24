module.exports = {
	name: 'roulette',
	aliases: [],
	description: 'Play a game of Russian roulette.',
	long: 'Play a game of Russian roulette.\nIf you survive, you win **1.2x** what you bet.\nIf you lose, you\'ll be shot for **20 - 50** damage (depending on your bet) and lose your bet amount.',
	args: { amount: 'Amount of Scrap to gamble.' },
	examples: ['roulette 1000'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const row = await app.player.getRow(message.author.id)
		const rouletteCD = await app.cd.getCD(message.author.id, 'roulette')
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.scrap >= 1000000 ? 1000000 : row.scrap
		}

		if (rouletteCD) {
			return message.reply(`You need to wait  \`${rouletteCD}\`  before using this command again.`)
		}

		if (row.health < 25) {
			return message.reply(`⚠ You need at least **25 HP** to use the \`roulette\` command, you currently have ${app.player.getHealthIcon(row.health, row.maxHealth)} **${row.health} / ${row.maxHealth}**.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return message.reply(`Please specify an amount of at least **${app.common.formatNumber(100, false, true)}** to gamble!`)
		}

		if (gambleAmount > row.scrap) {
			return message.reply(`❌ You don't have that much Scrap! You currently have **${app.common.formatNumber(row.scrap, false, true)}**. You can trade your ${app.icons.money} Lootcoin for ${app.icons.scrap} Scrap: \`${prefix}buy scrap <amount>\``)
		}

		if (gambleAmount > 1000000) {
			return message.reply(`You cannot gamble more than **${app.common.formatNumber(1000000, false, true)}**`)
		}

		await app.player.removeScrap(message.author.id, gambleAmount)

		const multiplier = 1.2
		const winnings = Math.floor(gambleAmount * multiplier)
		const chance = Math.floor(Math.random() * 100) // return 1-100

		if (chance <= 20) {
			let healthDeduct = getDamage(gambleAmount)

			if (row.health <= healthDeduct) {
				healthDeduct = row.health - 1

				await app.mysql.update('scores', 'health', 1, 'userId', message.author.id)
			}
			else {
				await app.mysql.updateDecr('scores', 'health', healthDeduct, 'userId', message.author.id)
			}

			message.reply('***Click***').then(msg => {
				setTimeout(() => {
					msg.edit(`<@${message.author.id}>, 💥 The gun fires! You took ***${healthDeduct}*** damage and now have ${app.player.getHealthIcon(row.health - healthDeduct, row.maxHealth)} **${row.health - healthDeduct} / ${row.maxHealth}** health. Oh, and you also lost **${app.common.formatNumber(gambleAmount, false, true)}** Scrap`)
				}, 1500)
			})
		}
		else {
			await app.player.addScrap(message.author.id, winnings)

			message.reply('***Click***').then(msg => {
				setTimeout(() => {
					msg.edit(`<@${message.author.id}>, You survived! Your winnings are: **${app.common.formatNumber(winnings, false, true)}**`)
				}, 1500)
			})
		}

		await app.cd.setCD(message.author.id, 'roulette', 1000 * app.config.cooldowns.roulette)
	}
}

function getDamage(bet) {
	// max damage at 50k+ bets.
	const percDamageAdded = bet / 50000 > 1 ? 1 : bet / 50000

	return 20 + Math.floor(percDamageAdded * 30)
}

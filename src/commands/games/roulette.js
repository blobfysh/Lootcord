const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'roulette',
	aliases: [],
	description: 'Play a game of Russian roulette.',
	long: 'Play a game of Russian roulette.\nIf you survive, you win **1.2x** what you bet.\nIf you lose, you\'ll be shot for **20 - 50** damage (depending on your bet) and lose your bet amount.',
	args: { amount: 'Amount of scrap to gamble.' },
	examples: ['roulette 1000'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const rouletteCD = await app.cd.getCD(message.author.id, 'roulette', { serverSideGuildId })
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.money >= 50000 ? 50000 : row.money
		}

		if (rouletteCD) {
			return reply(message, `You need to wait  \`${rouletteCD}\`  before using this command again.`)
		}

		if (row.health < 25) {
			return reply(message, `⚠ You need at least **25 HP** to use the \`roulette\` command, you currently have ${app.player.getHealthIcon(row.health, row.maxHealth)} **${row.health} / ${row.maxHealth}**.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return reply(message, `Please specify an amount of at least **${app.common.formatNumber(100)}** to gamble!`)
		}

		if (gambleAmount > row.money) {
			return reply(message, `❌ You don't have that much scrap! You currently have **${app.common.formatNumber(row.money)}**.`)
		}

		if (gambleAmount > 50000) {
			return reply(message, `You cannot gamble more than **${app.common.formatNumber(50000)}**`)
		}

		await app.player.removeMoney(message.author.id, gambleAmount, serverSideGuildId)

		const multiplier = 1.2
		const winnings = Math.floor(gambleAmount * multiplier)
		const chance = Math.floor(Math.random() * 100) // return 1-100

		if (chance <= 23) {
			let healthDeduct = getDamage(gambleAmount)

			if (row.health <= healthDeduct) {
				healthDeduct = row.health - 1
			}

			await app.player.subHealth(message.author.id, healthDeduct, serverSideGuildId)

			const botMessage = await reply(message, '****Click***')

			setTimeout(() => {
				botMessage.edit(`<@${message.author.id}>, 💥 The gun fires! You took ***${healthDeduct}*** damage and now have ${app.player.getHealthIcon(row.health - healthDeduct, row.maxHealth)} **${row.health - healthDeduct} / ${row.maxHealth}** health. Oh, and you also lost **${app.common.formatNumber(gambleAmount)}** scrap`)
			}, 1500)
		}
		else {
			await app.player.addMoney(message.author.id, winnings, serverSideGuildId)

			reply(message, '***Click***').then(msg => {
				setTimeout(() => {
					msg.edit(`<@${message.author.id}>, You survived! Your winnings are: **${app.common.formatNumber(winnings)}**`)
				}, 1500)
			}).catch(err => console.log)
		}

		await app.cd.setCD(message.author.id, 'roulette', 1000 * app.config.cooldowns.roulette, { serverSideGuildId })
	}
}

function getDamage (bet) {
	// max damage at 10k+ bets.
	const percDamageAdded = bet / 10000 > 1 ? 1 : bet / 10000

	return 20 + Math.floor(percDamageAdded * 30)
}

exports.command = {
	name: 'slots',
	aliases: ['slot'],
	description: 'Put some Scrap in the slot machine!',
	long: 'Play a game of slots.\n\n💵 💵 - **1x** multiplier\n💸 💸 - **1.5x** multiplier\n💰 💰 - **2.5x** multiplier\n💎 💎 - **5x** multiplier\n💵 💵 💵 - **2x** multiplier\n💸 💸 💸 - **3x** multiplier\n💰 💰 💰 - **5x** multiplier\n💎 💎 💎 - **10x** multiplier',
	args: { amount: 'Amount of Scrap to gamble.' },
	examples: ['slots 1000'],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const slotsCD = await app.cd.getCD(message.author.id, 'slots', { serverSideGuildId })
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.scrap >= 1000000 ? 1000000 : row.scrap
		}

		if (slotsCD) {
			return message.reply(`You need to wait \`${slotsCD}\` before playing another game of slots.`)
		}

		else if (!gambleAmount || gambleAmount < 100) {
			return message.reply(`Please specify an amount of at least **${app.common.formatNumber(100, false, true)}** to gamble!`)
		}

		else if (gambleAmount > row.scrap) {
			return message.reply(`❌ You don't have that much Scrap! You currently have **${app.common.formatNumber(row.scrap, false, true)}**. You can trade your ${app.icons.money} Lootcoin for ${app.icons.scrap} Scrap: \`${prefix}buy scrap <amount>\``)
		}

		else if (gambleAmount > 1000000) {
			return message.reply(`You cannot gamble more than **${app.common.formatNumber(1000000, false, true)}**`)
		}

		await app.player.removeScrap(message.author.id, gambleAmount, serverSideGuildId)
		await app.cd.setCD(message.author.id, 'slots', app.config.cooldowns.slots * 1000, { serverSideGuildId })

		const col1 = getSlot(Math.random())
		const col2 = getSlot(Math.random())
		const col3 = getSlot(Math.random())
		let multiplier = 0

		// all columns match
		if (col1.multi === col2.multi && col1.multi === col3.multi) {
			multiplier = col1.multi
		}
		// only 2 columns match
		else if (col1.multi === col2.multi || col2.multi === col3.multi) {
			multiplier = col2.multi / 2
		}

		const winnings = Math.floor(gambleAmount * multiplier)

		if (winnings > 0) {
			await app.player.addScrap(message.author.id, winnings, serverSideGuildId)
		}

		if (winnings >= 2000000) {
			await app.itm.addBadge(message.author.id, 'gambler', serverSideGuildId)
		}

		const slotEmbed = new app.Embed()
			.setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
			.setTitle('Slot Machine')
			.setDescription(`⬛ ${app.icons.slots_toprow_gif.repeat(3)} ⬛\n▶ ${app.icons.slots_midrow_gif.repeat(3)} ◀\n⬛ ${app.icons.slots_botrow_gif.repeat(3)} ⬛`)

		const botMsg = await message.channel.createMessage(slotEmbed)

		setTimeout(() => {
			const newEmbed = slotEmbed
				.setDescription(`⬛ ${col1.top} ${app.icons.slots_toprow_gif.repeat(2)} ⬛\n▶ ${col1.mid} ${app.icons.slots_midrow_gif.repeat(2)} ◀\n⬛ ${col1.bot} ${app.icons.slots_botrow_gif.repeat(2)} ⬛`)

			botMsg.edit(newEmbed)
		}, 1000)

		setTimeout(() => {
			const newEmbed = slotEmbed
				.setDescription(`⬛ ${col1.top} ${col2.top} ${app.icons.slots_toprow_gif} ⬛\n▶ ${col1.mid} ${col2.mid} ${app.icons.slots_midrow_gif} ◀\n⬛ ${col1.bot} ${col2.bot} ${app.icons.slots_botrow_gif} ⬛`)

			botMsg.edit(newEmbed)
		}, 2000)

		setTimeout(() => {
			const newEmbed = slotEmbed
				.setDescription(`⬛ ${col1.top} ${col2.top} ${col3.top}⬛\n▶ ${col1.mid} ${col2.mid} ${col3.mid} ◀\n⬛ ${col1.bot} ${col2.bot} ${col3.bot} ⬛`)
			let endString = ''

			if (winnings > 0) {
				newEmbed.setColor(720640)
				endString = `You won **${app.common.formatNumber(winnings, false, true)} scrap** (${multiplier}x)`
			}
			else {
				newEmbed.setColor(13632027)
				endString = 'You lost!'
			}

			botMsg.edit({
				embed: newEmbed.embed,
				content: endString
			})
		}, 3500)
	}
}

const getSlot = exports.getSlot = function getSlot(randomInt) {
	if (randomInt < 0.1) {
		return {
			top: '💰',
			mid: '💎',
			bot: '💵',
			multi: 10
		}
	}
	else if (randomInt < 0.3) {
		return {
			top: '💸',
			mid: '💰',
			bot: '💎',
			multi: 5
		}
	}
	else if (randomInt < 0.6) {
		return {
			top: '💵',
			mid: '💸',
			bot: '💰',
			multi: 3
		}
	}

	return {
		top: '💎',
		mid: '💵',
		bot: '💸',
		multi: 2
	}
}

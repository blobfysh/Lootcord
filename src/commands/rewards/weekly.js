const QUOTES = [
	'✨ Oh look, I found this {icon}{item} and {icon2}{item2} for you!',
	'{ez} Here\'s a free {icon}{item} and {icon2}{item2}!'
]

exports.command = {
	name: 'weekly',
	aliases: [],
	description: 'Receive a free supply_drop every week!',
	long: 'Use this command to receive a free supply_drop every week.\n\nThe weekly command is exclusive to patreon donators: https://www.patreon.com/lootcord.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	premiumCmd: true,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,
	patronTier1Only: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const weeklyCD = await app.cd.getCD(message.author.id, 'weekly', { serverSideGuildId })

		if (weeklyCD) {
			return message.reply(`You've already claimed your weekly reward! Wait \`${weeklyCD}\` before claiming again.`)
		}

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), await app.player.getRow(message.author.id, serverSideGuildId))
		const hasEnough = await app.itm.hasSpace(itemCt, 2)
		if (!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** (You need **2** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)

		await app.cd.setCD(message.author.id, 'weekly', app.config.cooldowns.weekly * 1000, { serverSideGuildId })

		await app.itm.addItem(message.author.id, 'supply_drop', 1, serverSideGuildId)
		await app.itm.addItem(message.author.id, 'reroll_scroll', 1, serverSideGuildId)

		message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)]
			.replace('{ez}', app.icons.blackjack_dealer_neutral)
			.replace('{icon}', app.itemdata.supply_drop.icon)
			.replace('{item}', '`supply_drop`')
			.replace('{icon2}', app.itemdata.reroll_scroll.icon)
			.replace('{item2}', '`reroll_scroll`'))
	}
}

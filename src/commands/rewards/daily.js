const QUOTES = [
	'**Oh look, I found this {icon}{item} for you!** Open it to see what\'s inside: `{prefix}use military_crate`\n\nWant more? Try the `hourly`, `vote` commands.',
	'**Here\'s a free {icon}{item}!** Open it to see what\'s inside: `{prefix}use military_crate`\n\nWant more? Try the `hourly`, `vote` commands.',
	'**You earned a free {icon}{item}!** Open it to see what\'s inside: `{prefix}use military_crate`\n\nWant more? Try the `hourly`, `vote` commands.'
]
const OFFICIAL_QUOTES = [
	'You gained **2x** {icon}{item} for playing in the official Lootcord server! 😎'
]

module.exports = {
	name: 'daily',
	aliases: [''],
	description: 'Receive a free military_crate every day!',
	long: 'Use this command to receive a free military_crate every day.\n\n**Receive double the reward when used in the official Discord!**',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const dailyCD = await app.cd.getCD(message.author.id, 'daily')

		if (dailyCD) {
			return message.reply(`You've already claimed your daily reward today! Wait \`${dailyCD}\` before claiming another.`)
		}

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), await app.player.getRow(message.author.id))
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		if (!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** (You need **1** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)

		await app.cd.setCD(message.author.id, 'daily', app.config.cooldowns.daily * 1000)

		if (message.channel.guild.id === app.config.supportGuildID) {
			await app.itm.addItem(message.author.id, 'military_crate', 2)
			message.reply(OFFICIAL_QUOTES[Math.floor(Math.random() * OFFICIAL_QUOTES.length)]
				.replace('{icon}', app.itemdata.military_crate.icon)
				.replace('{item}', '`military_crate`'))
		}
		else {
			await app.itm.addItem(message.author.id, 'military_crate', 1)
			message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)]
				.replace('{icon}', app.itemdata.military_crate.icon)
				.replace('{item}', '`military_crate`')
				.replace('{prefix}', prefix))
		}
	}
}

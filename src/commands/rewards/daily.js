const { reply } = require('../../utils/messageUtils')

const QUOTES = [
	'☃️ Here\'s a {icon2}{item2} and a {icon}{item}\n\nWant more? Try the `farm`, `vote` commands.'
]
const OFFICIAL_QUOTES = [
	'☃️ You receieved **2x** {icon2}{item2} and **2x** {icon}{item} for playing in the official Lootcord server! 😎'
]

exports.command = {
	name: 'daily',
	aliases: [],
	description: '🎄 Claim a present every day!',
	long: '🎄 Claim a present every day!\n\n**Receive double the reward when used in the official Discord!**',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const dailyCD = await app.cd.getCD(message.author.id, 'daily', { serverSideGuildId })

		if (dailyCD) {
			return reply(message, `You've already claimed your daily reward today! Wait \`${dailyCD}\` before claiming another.`)
		}

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), await app.player.getRow(message.author.id, serverSideGuildId))
		const hasEnough = await app.itm.hasSpace(itemCt, 2)
		if (!hasEnough) return reply(message, `❌ **You don't have enough space in your inventory!** (You need **2** open slots, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)

		await app.cd.setCD(message.author.id, 'daily', app.config.cooldowns.daily * 1000, { serverSideGuildId })

		if (message.channel.guild.id === app.config.supportGuildID) {
			await app.itm.addItem(message.author.id, 'military_crate', 2, serverSideGuildId)
			await app.itm.addItem(message.author.id, 'small_present', 2, serverSideGuildId)
			await reply(message, OFFICIAL_QUOTES[Math.floor(Math.random() * OFFICIAL_QUOTES.length)]
				.replace('{icon}', app.itemdata.military_crate.icon)
				.replace('{item}', '`military_crate`')
				.replace('{icon2}', app.itemdata.small_present.icon)
				.replace('{item2}', '`small_present`'))
		}
		else {
			await app.itm.addItem(message.author.id, 'military_crate', 1, serverSideGuildId)
			await app.itm.addItem(message.author.id, 'small_present', 1, serverSideGuildId)
			await reply(message, QUOTES[Math.floor(Math.random() * QUOTES.length)]
				.replace('{icon}', app.itemdata.military_crate.icon)
				.replace('{item}', '`military_crate`')
				.replace('{icon2}', app.itemdata.small_present.icon)
				.replace('{item2}', '`small_present`')
				.replace('{prefix}', prefix))
		}
	}
}

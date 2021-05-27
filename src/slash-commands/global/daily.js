const { InteractionResponseType } = require('slash-commands')
const QUOTES = [
	'**Oh look, I found this {icon}{item} for you!** Open it to see what\'s inside: `t-use military_crate`\n\nWant more? Try the `farm`, `vote` commands.',
	'**Here\'s a free {icon}{item}!** Open it to see what\'s inside: `t-use military_crate`\n\nWant more? Try the `farm`, `vote` commands.',
	'**You earned a free {icon}{item}!** Open it to see what\'s inside: `t-use military_crate`\n\nWant more? Try the `farm`, `vote` commands.'
]
const OFFICIAL_QUOTES = [
	'You gained **2x** {icon}{item} for playing in the official Lootcord server! 😎'
]

exports.command = {
	name: 'daily',
	description: 'Claim your daily military_crate!',
	requiresAcc: true,
	requiresActive: true,
	options: [],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const dailyCD = await app.cd.getCD(interaction.member.user.id, 'daily', { serverSideGuildId })

		if (dailyCD) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `You've already claimed your daily reward today! Wait \`${dailyCD}\` before claiming another.`
				}
			})
		}

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(interaction.member.user.id, serverSideGuildId), await app.player.getRow(interaction.member.user.id, serverSideGuildId))
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		if (!hasEnough) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `❌ **You don't have enough space in your inventory!** (You need **1** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`
				}
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'daily', app.config.cooldowns.daily * 1000, { serverSideGuildId })

		if (interaction.guildID === app.config.supportGuildID) {
			await app.itm.addItem(interaction.member.user.id, 'military_crate', 2, serverSideGuildId)

			await interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: OFFICIAL_QUOTES[Math.floor(Math.random() * OFFICIAL_QUOTES.length)]
						.replace('{icon}', app.itemdata.military_crate.icon)
						.replace('{item}', '`military_crate`')
				}
			})
		}
		else {
			await app.itm.addItem(interaction.member.user.id, 'military_crate', 1, serverSideGuildId)

			await interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: QUOTES[Math.floor(Math.random() * QUOTES.length)]
						.replace('{icon}', app.itemdata.military_crate.icon)
						.replace('{item}', '`military_crate`')
				}
			})
		}
	}
}

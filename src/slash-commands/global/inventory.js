const { InteractionResponseType, ApplicationCommandOptionType } = require('slash-commands')
const { makeInventory } = require('../../commands/info/inventory')

exports.command = {
	name: 'inventory',
	description: 'Shows your current inventory including items, health, level, xp, and money.',
	requiresAcc: true,
	requiresActive: false,
	options: [
		{
			type: ApplicationCommandOptionType.USER,
			name: 'user',
			description: 'User to retrieve inventory of.'
		}
	],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const userOpt = interaction.data.options && interaction.data.options.find(opt => opt.name === 'user').value
		let inv

		// defer response because fetching user may take time
		await interaction.respond({
			type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
		})

		if (userOpt) {
			const user = await app.common.fetchUser(userOpt, { cacheIPC: false })
			inv = await makeInventory(app, user, interaction.guild_id, serverSideGuildId)
		}
		else {
			inv = await makeInventory(app, interaction.member.user, interaction.guild_id, serverSideGuildId)
		}

		if (inv.embed) {
			await interaction.editResponse({
				embeds: [inv.embed]
			})
		}
		else {
			await interaction.editResponse(inv)
		}
	}
}

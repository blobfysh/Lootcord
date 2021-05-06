const { InteractionResponseType, ApplicationCommandOptionType } = require('slash-commands')
const { generatePages } = require('../../commands/info/inventory')

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
		},
		{
			type: ApplicationCommandOptionType.INTEGER,
			name: 'page',
			description: 'Page of users inventory to retrieve (if user has multiple pages worth of items).'
		}
	],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const userOpt = interaction.data.options && interaction.data.options.find(opt => opt.name === 'user') && interaction.data.options.find(opt => opt.name === 'user').value
		let pageOpt = interaction.data.options && interaction.data.options.find(opt => opt.name === 'page') && interaction.data.options.find(opt => opt.name === 'page').value
		let response

		pageOpt = pageOpt || 1

		// defer response because fetching user may take time
		await interaction.respond({
			type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
		})

		if (userOpt) {
			const user = await app.common.fetchUser(userOpt, { cacheIPC: false })
			const invPages = await generatePages(app, user, interaction.guild_id, serverSideGuildId)

			// make sure inventory page exists
			if (invPages[pageOpt - 1] === undefined) {
				response = {
					content: `❌ **${user.username}** does not have that many pages worth of items.`
				}
			}
			else {
				response = invPages[pageOpt - 1]
			}
		}
		else {
			const invPages = await generatePages(app, interaction.member.user, interaction.guild_id, serverSideGuildId)

			if (invPages[pageOpt - 1] === undefined) {
				response = {
					content: `❌ You only have **${invPages.length}** pages worth of items.`
				}
			}
			else {
				response = invPages[pageOpt - 1]
			}
		}

		if (response.embed) {
			await interaction.editResponse({
				embeds: [response.embed]
			})
		}
		else {
			await interaction.editResponse(response)
		}
	}
}

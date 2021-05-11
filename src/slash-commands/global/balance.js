const { InteractionResponseType } = require('slash-commands')

exports.command = {
	name: 'balance',
	description: 'Displays your current balance.',
	requiresAcc: true,
	requiresActive: false,
	options: [],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(interaction.member.user.id, serverSideGuildId)

		return interaction.respond({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: `You currently have ${app.common.formatNumber(row.money)}`
			}
		})
	}
}

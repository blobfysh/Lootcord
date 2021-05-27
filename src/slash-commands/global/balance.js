exports.command = {
	name: 'balance',
	description: 'Displays your current balance.',
	requiresAcc: true,
	requiresActive: false,
	options: [],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(interaction.member.user.id, serverSideGuildId)

		return interaction.respond({
			content: `You currently have ${app.common.formatNumber(row.money)}`
		})
	}
}

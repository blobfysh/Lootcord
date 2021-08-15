exports.command = {
	name: 'panda',
	description: ':)',
	requiresAcc: true,
	requiresActive: false,
	options: [],
	// ids of the guilds the command should be registered to
	guilds: ['454163538055790604'],

	async execute (app, interaction, { guildInfo, serverSideGuildId }) {
		return interaction.respond({
			content: '<a:panda:876325756383428669>'
		})
	}
}

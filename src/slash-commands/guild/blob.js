exports.command = {
	name: 'blob',
	description: 'Why is this a command?',
	requiresAcc: true,
	requiresActive: false,
	options: [],
	// ids of the guilds the command should be registered to
	guilds: ['454163538055790604'],

	async execute (app, interaction, { guildInfo, serverSideGuildId }) {
		return interaction.respond({
			content: '<:bleh:816552098602418237>'
		})
	}
}

exports.command = {
	name: 'power',
	aliases: [],
	description: 'View your current power.',
	long: 'View your current power.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)

		message.reply(`You currently have **${row.power}/${row.max_power}** power.`)
	}
}

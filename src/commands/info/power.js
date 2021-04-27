module.exports = {
	name: 'power',
	aliases: [],
	description: 'View your current power.',
	long: 'View your current power.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)

		message.reply(`You currently have **${row.power}/${row.max_power}** power.`)
	}
}

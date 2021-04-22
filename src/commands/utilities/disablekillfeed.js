module.exports = {
	name: 'disablekillfeed',
	aliases: [],
	description: 'Removes the kill feed channel for the server.',
	long: 'Stops the bot from logging all kills in the server.\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: true,

	async execute(app, message, { args, prefix }) {
		await app.query(`UPDATE guildInfo SET killChan = 0 WHERE guildId = "${message.channel.guild.id}"`)

		message.reply('✅ Disabled kill feed for this server!')
	}
}

module.exports = {
	name: 'togglelevelchannel',
	aliases: ['setlevelchan', 'setlevelchannel', 'togglelevelchan', 'togglelvlchan', 'togglelvlchannel'],
	description: 'Toggles whether or not to send all level up messages for the server to the channel this command is used in.',
	long: 'Toggle a channel to send all level up messages to.\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: true,

	async execute(app, message, { args, prefix }) {
		const guildRow = await app.common.getGuildInfo(message.channel.guild.id)

		if (guildRow.levelChan === 0) {
			await app.query(`UPDATE guildInfo SET levelChan = "${message.channel.id}" WHERE guildId = "${message.channel.guild.id}"`)

			message.reply('✅ Now sending level up messages to this channel!')
		}
		else {
			await app.query(`UPDATE guildInfo SET levelChan = 0 WHERE guildId = "${message.channel.guild.id}"`)

			message.reply('✅ Disabled level channel for this server!')
		}
	}
}

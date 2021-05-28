const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'togglekillfeed',
	aliases: ['setkillfeed', 'setkillchan', 'togglekillchan'],
	description: 'Toggles the channel its used in as the kill feed for the server.',
	long: 'Toggle the current channel as the kill feed channel, will log all kills from the server in that channel.\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		if (guildInfo.killChan === 0) {
			await app.query(`UPDATE guildinfo SET killChan = ${message.channel.id} WHERE guildId = ${message.channel.guild.id}`)

			await reply(message, '✅ Set this channel as the kill feed channel!')
		}
		else {
			await app.query(`UPDATE guildinfo SET killChan = 0 WHERE guildId = "${message.channel.guild.id}"`)

			await reply(message, '✅ Disabled kill feed for this server!')
		}
	}
}

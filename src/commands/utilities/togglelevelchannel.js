const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'togglelevelchannel',
	aliases: ['setlevelchan', 'setlevelchannel', 'togglelevelchan', 'togglelvlchan', 'togglelvlchannel'],
	description: 'Toggles whether or not to send all level up messages for the server to the channel this command is used in.',
	long: 'Toggle a channel to send all level up messages to.\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		if (guildInfo.levelChan === 0) {
			await app.query(`UPDATE guildinfo SET levelChan = "${message.channel.id}" WHERE guildId = "${message.channel.guild.id}"`)

			await reply(message, '✅ Now sending level up messages to this channel!')
		}
		else {
			await app.query(`UPDATE guildinfo SET levelChan = 0 WHERE guildId = "${message.channel.guild.id}"`)

			await reply(message, '✅ Disabled level channel for this server!')
		}
	}
}

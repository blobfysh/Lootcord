const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'toggleraidnotify',
	aliases: ['toggleclannotify'],
	description: 'Toggle this to enable DMs when your clan is raided.',
	long: 'Toggle notifications whenever your clan gets raided.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)

		if (row.notify3 === 0) {
			if (serverSideGuildId) {
				await app.query('UPDATE server_scores SET notify3 = 1 WHERE userId = ? AND guildId = ?', [message.author.id, message.channel.guild.id])
			}
			else {
				await app.query('UPDATE scores SET notify3 = 1 WHERE userId = ?', [message.author.id])
			}

			await reply(message, '✅ You will now receive a DM when your clan is raided.')
		}
		else {
			if (serverSideGuildId) {
				await app.query('UPDATE server_scores SET notify3 = 0 WHERE userId = ? AND guildId = ?', [message.author.id, message.channel.guild.id])
			}
			else {
				await app.query('UPDATE scores SET notify3 = 0 WHERE userId = ?', [message.author.id])
			}

			await reply(message, '❌ You will no longer receive a DM when your clan is raided.')
		}
	}
}

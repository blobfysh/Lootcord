const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'togglebmnotify',
	aliases: ['toggleblackmarketnotify'],
	description: 'Toggle this to enable DMs when you sell an item on the Black Market.',
	long: 'Toggle notifications whenever you sell an item on the Black Market.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	globalEconomyOnly: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		const row = await app.player.getRow(message.author.id)

		if (row.notify1 === 0) {
			await app.query(`UPDATE scores SET notify1 = 1 WHERE userId = ${message.author.id}`)

			await reply(message, '✅ You will now receive notifications for sold items on the Black Market.')
		}
		else {
			await app.query(`UPDATE scores SET notify1 = 0 WHERE userId = ${message.author.id}`)

			await reply(message, '❌ You will no longer receive notifications for sold items on the Black Market.')
		}
	}
}

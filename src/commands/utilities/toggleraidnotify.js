module.exports = {
	name: 'toggleraidnotify',
	aliases: ['toggleclannotify'],
	description: 'Toggle this to enable DMs when your clan is raided.',
	long: 'Toggle notifications whenever your clan gets raided.',
	args: {},
	examples: [],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message) {
		const row = await app.player.getRow(message.author.id)

		if (row.notify3 === 0) {
			await app.query(`UPDATE scores SET notify3 = 1 WHERE userId = ${message.author.id}`)

			message.reply('✅ You will now receive a DM when your clan is raided.')
		}
		else {
			await app.query(`UPDATE scores SET notify3 = 0 WHERE userId = ${message.author.id}`)

			message.reply('❌ You will no longer receive a DM when your clan is raided.')
		}
	}
}

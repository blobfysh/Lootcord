const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'givescrap',
	aliases: [],
	description: 'Used by server moderators to give players scrap. Can only be used if server-side economy mode is enabled.',
	long: 'Used by server moderators to give players scrap.\nCan only be used if server-side economy mode is enabled.\n\nUser **MUST** have the Manage Server permission.',
	args: {
		'amount': 'Amount of scrap to give.',
		'@user': 'User to give scrap to.'
	},
	examples: ['givescrap 30000 @blobfysh'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	serverEconomyOnly: true,
	guildModsOnly: true,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const member = app.parse.members(message, args)[0]
		const amount = app.parse.numbers(args)[0]

		if (!amount) {
			return reply(message, '❌ You must specify an amount of scrap to give!')
		}
		else if (!member) {
			return reply(message, '❌ You must specify who you want to give the scrap to!')
		}

		// using transaction for safety
		const transaction = await app.mysql.beginTransaction()
		const row = await app.player.getRowForUpdate(transaction.query, member.id, serverSideGuildId)

		if (!row) {
			await transaction.commit()
			return reply(message, `❌ **${member.username} has not created an account yet.** Have them use some commands first.`)
		}

		if (row.money + amount >= 1000000000) {
			await transaction.commit()
			return reply(message, `❌ **${member.username}** does not need more than **${app.common.formatNumber(1000000000)}!**`)
		}

		await app.player.addMoneySafely(transaction.query, member.id, amount, serverSideGuildId)
		await transaction.commit()

		return reply(message, `✅ Gave **${app.common.formatNumber(amount)}** to **${member.username}#${member.discriminator}**.`)
	}
}

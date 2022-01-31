const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'deleteitem',
	aliases: [],
	description: 'Used by bot moderators to delete players items. Only works for global economy.',
	long: 'Used by bot moderators to delete players items. Only works for global economy.',
	args: {
		'User ID': 'ID of user to delete item from.',
		'item': 'Item to delete.',
		'amount': 'Amount of item to delete.'
	},
	examples: ['deleteitem 168958344361541633 assault rifle 3'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	serverEconomyOnly: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const userID = args[0]
		const item = app.parse.items(args)[0]
		const amount = app.parse.numbers(args)[1] || 1

		if (message.channel.id !== app.config.modChannel) {
			return reply(message, '❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return reply(message, '❌ You forgot to include a user ID.')
		}
		else if (!item) {
			return reply(message, '❌ You must specify what item to delete!')
		}

		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		// using transaction for safety
		const transaction = await app.mysql.beginTransaction()
		const userItems = await app.itm.getItemObjectForUpdate(transaction.query, user.id, serverSideGuildId)

		if (!userItems[item] || userItems[item] < amount) {
			await transaction.commit()
			return reply(message, `❌ **${user.username}#${user.discriminator}** only has **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\`.`)
		}

		await app.itm.removeItemSafely(transaction.query, user.id, item, amount)
		await transaction.commit()

		return reply(message, `✅ Removed **${amount}x** ${app.itemdata[item].icon}\`${item}\` from **${user.username}#${user.discriminator}**.`)
	}
}

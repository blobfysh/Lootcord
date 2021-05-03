exports.command = {
	name: 'giveitem',
	aliases: [],
	description: 'Used by server moderators to give players items. Can only be used if server-side economy mode is enabled.',
	long: 'Used by server moderators to give players items.\nCan only be used if server-side economy mode is enabled.\n\nUser **MUST** have the Manage Server permission.',
	args: {
		'item': 'Item to give.',
		'amount': 'Amount of item to give.',
		'@user': 'User to give item to.'
	},
	examples: ['giveitem assault rifle 3 @blobfysh'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	serverEconomyOnly: true,
	guildModsOnly: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const item = app.parse.items(args)[0]
		const member = app.parse.members(message, args)[0]
		const amount = app.parse.numbers(args)[0] || 1

		if (!item) {
			return message.reply('❌ You must specify what item to give!')
		}
		else if (!member) {
			return message.reply('❌ You must specify who you want to give the item to!')
		}
		else if (app.itemdata[item].isSpecial) {
			return message.reply('❌ You cannot give limited items.')
		}

		// using transaction for safety
		const transaction = await app.mysql.beginTransaction()
		const row = await app.player.getRowForUpdate(transaction.query, member.id, serverSideGuildId)

		if (!row) {
			await transaction.commit()
			return message.reply(`❌ **${member.username} has not created an account yet.** Have them use some commands first.`)
		}

		const userItems = await app.itm.getItemObjectForUpdate(transaction.query, member.id, serverSideGuildId)
		const itemCt = await app.itm.getItemCount(userItems, row)
		const hasSpace = await app.itm.hasSpace(itemCt, amount)

		if (!hasSpace && !app.itemdata[item].isBanner) {
			await transaction.commit()
			return message.reply(`❌ **${member.username} is out of inventory space!** (Open slots: **${itemCt.open}** Required: **${amount}**)\nHave them clear space by selling some items.`)
		}
		else if (app.itemdata[item].isBanner && itemCt.bannerCt + amount > 100) {
			await transaction.commit()
			return message.reply(`❌ **${member.username} cannot hold that many banners!** (100 max).`)
		}

		await app.itm.addItemSafely(transaction.query, member.id, item, amount, serverSideGuildId)
		await transaction.commit()

		return message.reply(`✅ Gave **${amount}x** ${app.itemdata[item].icon}\`${item}\` to **${member.username}#${member.discriminator}**.`)
	}
}

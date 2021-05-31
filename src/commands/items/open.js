const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'open',
	aliases: [],
	description: 'Opens a specified box.',
	long: 'Opens a specified box. You can also open boxes with the use command.',
	args: { item: 'Box to open.', amount: 'Amount to open.' },
	examples: ['open crate 10', 'open supply drop'],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const item = app.parse.items(args)[0]
		let amount = app.parse.numbers(args)[0] || 1

		if (!item) {
			return reply(message, `❌ You need to specify a box to open! \`${prefix}open <item>\`.`)
		}
		else if (app.itemdata[item].dropsItems) {
			const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
			const itemCt = await app.itm.getItemCount(userItems, row)
			if (amount > 10) amount = 10

			if (!await app.itm.hasItems(userItems, item, amount)) {
				return reply(message, `❌ You don't have enough of that item! You have **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\``)
			}

			// open box
			if (!await app.itm.hasSpace(itemCt, (app.itemdata[item].dropsItems * amount) - amount)) {
				return reply(message, `❌ **You don't have enough space in your inventory!** (You have **${itemCt.capacity}** items in your inventory and you need space for **${(app.itemdata[item].dropsItems * amount) - amount}**)\n\nYou can clear up space by selling some items.`)
			}

			await app.itm.removeItem(message.author.id, item, amount, serverSideGuildId)

			const results = app.itm.openBox(item, app.itemdata[item].dropsItems * amount, row.luck)

			await app.itm.addItem(message.author.id, results.itemAmounts, null, serverSideGuildId)
			await app.player.addPoints(message.author.id, results.xp, serverSideGuildId)

			await reply(message, `You open **${amount}x** ${app.itemdata[item].icon}\`${item}\`'s and find:\n\n${app.itm.getDisplay(results.itemAmounts.sort(app.itm.sortItemsHighLow.bind(app))).join('\n')}\n\n...and \`⭐ ${results.xp} XP\`!`)
		}
		else {
			return reply(message, '❌ That item cannot be opened.')
		}
	}
}

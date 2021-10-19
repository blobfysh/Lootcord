const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'withdraw',
	aliases: ['take'],
	description: 'Withdraw items from your clan\'s storage.',
	long: 'Withdraw items from your clan\'s storage.',
	args: { 'item/scrap': 'Item to withdraw or scrap to withdraw.', 'amount': 'Amount of item or scrap to take out.' },
	examples: ['clan withdraw military_crate 2', 'clan withdraw 2000'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 1,
	levelReq: 1,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const itemName = app.parse.items(args)[0]
		let itemAmnt = app.parse.numbers(args)[0]
		let isMoney = false
		let isAll = false

		if (!itemName && itemAmnt) {
			isMoney = true
		}
		else if (!itemName && !itemAmnt && args[0] && args[0].toLowerCase() === 'all') {
			isMoney = true
			isAll = true
		}

		if (await app.cd.getCD(message.author.id, 'tradeban')) {
			return reply(message, '❌ You are trade banned.')
		}
		else if (!itemName && !itemAmnt && !isAll) {
			return reply(message, 'You need to specify an item or scrap to withdraw from the clan! `clan withdraw <item/scrap> <amount>`')
		}

		if (isMoney) {
			try {
				const transaction = await app.mysql.beginTransaction()
				const clanRow = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId, serverSideGuildId)

				if (isAll) {
					itemAmnt = clanRow.money
				}

				if (clanRow.money < itemAmnt) {
					await transaction.commit()
					return reply(message, `Your clan bank only has ${app.common.formatNumber(clanRow.money)}...`)
				}

				await app.clans.removeMoneySafely(transaction.query, scoreRow.clanId, itemAmnt, serverSideGuildId)
				await app.player.addMoneySafely(transaction.query, message.author.id, itemAmnt, serverSideGuildId)
				await transaction.commit()

				await app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} withdrew ${app.common.formatNumber(itemAmnt, true)}`, serverSideGuildId)

				return reply(message, `Withdrew **${app.common.formatNumber(itemAmnt)}**\n\nThe clan bank now has **${app.common.formatNumber(clanRow.money - itemAmnt)}**`)
			}
			catch (err) {
				console.log(err)
				return reply(message, 'There was an error trying to withdraw.')
			}
		}

		// withdraw items
		itemAmnt = itemAmnt || 1

		if (!itemName) {
			return reply(message, '❌ I don\'t recognize that item.')
		}

		try {
			const transaction = await app.mysql.beginTransaction()
			const clanItems = await app.clans.getItemObjectForUpdate(transaction.query, scoreRow.clanId, serverSideGuildId)

			const hasItems = await app.itm.hasItems(clanItems, itemName, itemAmnt)

			if (!hasItems) {
				await transaction.commit()
				return reply(message, `Your clan has **${clanItems[itemName] !== undefined ? `${clanItems[itemName]}x` : '0'}** ${app.itemdata[itemName].icon}\`${itemName}\`${!clanItems[itemName] || clanItems[itemName] > 1 ? '\'s' : ''}...`)
			}

			const itemCt = await app.itm.getItemCount(await app.itm.getItemObjectForUpdate(transaction.query, message.author.id, serverSideGuildId), scoreRow)
			const hasSpace = await app.itm.hasSpace(itemCt, itemAmnt)

			if (!hasSpace) {
				await transaction.commit()
				return reply(message, `❌ **You don't have enough space in your inventory!** (You need **${itemAmnt}** open slot${itemAmnt > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
			}

			await app.clans.removeItemSafely(transaction.query, scoreRow.clanId, itemName, itemAmnt, serverSideGuildId)
			await app.itm.addItemSafely(transaction.query, message.author.id, itemName, itemAmnt, serverSideGuildId)
			await transaction.commit()

			await app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} withdrew ${itemAmnt}x ${itemName}`)

			await reply(message, `Withdrew ${itemAmnt}x ${app.itemdata[itemName].icon}\`${itemName}\` from your clan.\n\nThe clan storage now has **${clanItems[itemName] - itemAmnt}x** ${app.itemdata[itemName].icon}\`${itemName}\`.`)
		}
		catch (err) {
			return reply(message, 'There was an error trying to withdraw.')
		}
	}
}

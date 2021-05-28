const { CLANS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'deposit',
	aliases: ['put'],
	description: 'Deposit items into your clan\'s storage.',
	long: 'Deposit items into your clan\'s storage.',
	args: { 'item/scrap': 'Item to deposit or scrap to deposit.', 'amount': 'Amount of item or scrap to deposit.' },
	examples: ['clan deposit assault_rifle 1', 'clan deposit 3000'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 1,
	levelReq: 3,

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
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
			return reply(message, 'You need to specify an item or scrap to deposit into the clan! `clan deposit <item/scrap> <amount>`')
		}

		if (isMoney) {
			try {
				const transaction = await app.mysql.beginTransaction()
				const userRow = await app.player.getRowForUpdate(transaction.query, message.author.id)
				const clanRow = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
				const bankLimit = CLANS.levels[clanRow.level].bankLimit

				if (isAll) {
					itemAmnt = Math.min(bankLimit - clanRow.money, userRow.money)
				}

				if (itemAmnt > userRow.money) {
					await transaction.commit()
					return reply(message, `❌ You don't have that much scrap! You currently have **${app.common.formatNumber(userRow.money)}**`)
				}
				else if (clanRow.money + itemAmnt > bankLimit) {
					await transaction.commit()

					if (bankLimit - clanRow.money <= 0) {
						return reply(message, `**Your clan bank is packed!**\n\nThe bank cannot hold more than **${app.common.formatNumber(bankLimit)}**. You can increase this by upgrading the clan with \`${prefix}clan upgrade\`.`)
					}

					return reply(message, `Your clan can only hold **${app.common.formatNumber(bankLimit - clanRow.money)}** more in the bank. You can increase this by upgrading the clan with \`${prefix}clan upgrade\`.`)
				}

				await app.clans.addMoneySafely(transaction.query, scoreRow.clanId, itemAmnt)
				await app.player.removeMoneySafely(transaction.query, message.author.id, itemAmnt)
				await transaction.commit()

				await app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} deposited ${app.common.formatNumber(itemAmnt, true)} scrap`)

				return reply(message, `Deposited **${app.common.formatNumber(itemAmnt)}**\n\nThe clan bank now has **${app.common.formatNumber(clanRow.money + itemAmnt)}**`)
			}
			catch (err) {
				return reply(message, 'There was an error trying to deposit.')
			}
		}

		// check for items
		itemAmnt = itemAmnt || 1

		if (!itemName) {
			return reply(message, '❌ I don\'t recognize that item.')
		}
		else if (!app.itemdata[itemName].canBeStolen) {
			return reply(message, `\`${itemName}\`'s are bound to the player, meaning you can't trade them or put them in the clan inventory.`)
		}

		try {
			const transaction = await app.mysql.beginTransaction()
			const clanData = await app.clans.getClanData(await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId), await app.itm.getItemObjectForUpdate(transaction.query, scoreRow.clanId))

			if (!await app.clans.hasSpace(clanData, itemAmnt)) {
				await transaction.commit()
				return reply(message, `❌ Theres not enough space in the clan! Your clan is currently holding **${clanData.itemCount} / ${clanData.vaultSlots}** items.`)
			}

			const userItems = await app.itm.getItemObjectForUpdate(transaction.query, message.author.id)
			const hasItems = await app.itm.hasItems(userItems, itemName, itemAmnt)

			if (!hasItems) {
				await transaction.commit()
				return reply(message, `❌ You don't have enough of that item! You have **${userItems[itemName] || 0}x** ${app.itemdata[itemName].icon}\`${itemName}\``)
			}

			await app.itm.addItemSafely(transaction.query, scoreRow.clanId, itemName, itemAmnt)
			await app.itm.removeItemSafely(transaction.query, message.author.id, itemName, itemAmnt)
			await transaction.commit()

			await app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} deposited ${itemAmnt}x ${itemName}`)

			await reply(message, `Deposited ${itemAmnt}x ${app.itemdata[itemName].icon}\`${itemName}\` to the clan storage.`)
		}
		catch (err) {
			return reply(message, 'There was an error trying to deposit.')
		}
	}
}

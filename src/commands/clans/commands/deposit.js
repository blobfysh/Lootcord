module.exports = {
	name: 'deposit',
	aliases: ['put'],
	description: 'Deposit items into your clans vault.',
	long: 'Deposit items into your clans vault.',
	args: { 'item/money': 'Item to deposit or money to deposit.', 'amount': 'Amount of item or money to deposit.' },
	examples: ['clan deposit assault_rifle 1', 'clan deposit 3000'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 1,
	levelReq: 3,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const itemName = app.parse.items(args)[0]
		let itemAmnt = app.parse.numbers(args)[0]
		let isMoney = false
		if (!itemName && itemAmnt) { isMoney = true }

		else if (!itemName && !itemAmnt && args[0] && args[0].toLowerCase() === 'all') {
			isMoney = true
			itemAmnt = scoreRow.money
		}


		if (await app.cd.getCD(message.author.id, 'tradeban')) {
			return message.reply('❌ You are trade banned.')
		}
		else if (!itemName && !itemAmnt) {
			return message.reply('You need to specify an item or money to deposit into the clan! `clan deposit <item/money> <amount>`')
		}

		if (isMoney) {
			try {
				const transaction = await app.mysql.beginTransaction()
				const userRow = await app.player.getRowForUpdate(transaction.query, message.author.id)
				const clanRow = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
				const bankLimit = app.clans.getBankLimit((await app.clans.getMembers(scoreRow.clanId)).count)

				if (itemAmnt > userRow.money) {
					await transaction.commit()
					return message.reply(`❌ You don't have that much money! You currently have **${app.common.formatNumber(userRow.money)}**`)
				}
				else if (clanRow.money + itemAmnt > bankLimit) {
					await transaction.commit()

					if (bankLimit - clanRow.money <= 0) {
						return message.reply(`**Your clan bank is packed!**\n\nThe bank cannot hold more than **${app.common.formatNumber(bankLimit)}**. You can increase this amount by inviting more members to the clan.`)
					}

					return message.reply(`Your clan can only hold **${app.common.formatNumber(bankLimit - clanRow.money)}** more in the bank. You can increase this by inviting more members to the clan.`)
				}

				await app.clans.addMoneySafely(transaction.query, scoreRow.clanId, itemAmnt)
				await app.player.removeMoneySafely(transaction.query, message.author.id, itemAmnt)
				await transaction.commit()

				app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} deposited ${app.common.formatNumber(itemAmnt, true)} Lootcoin`)

				return message.reply(`Deposited **${app.common.formatNumber(itemAmnt)}**\n\nThe clan bank now has **${app.common.formatNumber(clanRow.money + itemAmnt)}**`)
			}
			catch (err) {
				return message.reply('There was an error trying to deposit.')
			}
		}

		// check for items
		itemAmnt = itemAmnt || 1

		if (!itemName) {
			return message.reply('❌ I don\'t recognize that item.')
		}
		else if (!app.itemdata[itemName].canBeStolen) {
			return message.reply(`\`${itemName}\`'s are bound to the player, meaning you can't trade them or put them in the clan vault.`)
		}

		try {
			const transaction = await app.mysql.beginTransaction()
			const clanData = await app.clans.getClanData(await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId))

			if (!await app.clans.hasPower(clanData, itemAmnt)) {
				await transaction.commit()
				return message.reply(`Theres not enough power available in the clan! Your vault is currently using **${clanData.usedPower}** power and only has **${clanData.currPower}** current power.`)
			}

			const userItems = await app.itm.getItemObjectForUpdate(transaction.query, message.author.id)
			const hasItems = await app.itm.hasItems(userItems, itemName, itemAmnt)

			if (!hasItems) {
				await transaction.commit()
				return message.reply(`❌ You don't have enough of that item! You have **${userItems[itemName] || 0}x** ${app.itemdata[itemName].icon}\`${itemName}\``)
			}

			await app.itm.addItemSafely(transaction.query, scoreRow.clanId, itemName, itemAmnt)
			await app.itm.removeItemSafely(transaction.query, message.author.id, itemName, itemAmnt)
			await transaction.commit()

			app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} deposited ${itemAmnt}x ${itemName}`)

			const clanItems = await app.itm.getItemObject(scoreRow.clanId)
			const clanPow = await app.clans.getClanData(await app.clans.getRow(scoreRow.clanId))

			message.reply(`Deposited ${itemAmnt}x ${app.itemdata[itemName].icon}\`${itemName}\` to your clan vault.\n\nThe vault now has **${clanItems[itemName]}x** ${app.itemdata[itemName].icon}\`${itemName}\` and is using **${`${clanPow.usedPower}/${clanPow.currPower}`}** power.`)
		}
		catch (err) {
			return message.reply('There was an error trying to deposit.')
		}
	}
}

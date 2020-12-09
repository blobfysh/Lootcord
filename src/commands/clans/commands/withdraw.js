module.exports = {
	name: 'withdraw',
	aliases: ['take'],
	description: 'Withdraw items from your clans vault.',
	long: 'Withdraw items from your clans vault.',
	args: { 'item/money': 'Item to withdraw or money to withdraw.', 'amount': 'Amount of item or money to take out.' },
	examples: ['clan withdraw military_crate 2', 'clan withdraw 2000'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 1,
	levelReq: 3,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const itemName = app.parse.items(args)[0]
		let itemAmnt = app.parse.numbers(args)[0]
		let isMoney = false
		if (!itemName && itemAmnt) isMoney = true

		if (await app.cd.getCD(message.author.id, 'tradeban')) {
			return message.reply('❌ You are trade banned.')
		}
		else if (await app.cd.getCD(scoreRow.clanId.toString(), 'getting_raided')) {
			return message.reply('Your clan is being raided **RIGHT NOW**, you cannot withdraw items while being raided.')
		}
		else if (!itemName && !itemAmnt) {
			return message.reply('You need to specify an item or money to withdraw from the clan! `clan withdraw <item/money> <amount>`')
		}

		if (isMoney) {
			const hasMoney = await app.clans.hasMoney(scoreRow.clanId, itemAmnt)

			if (!hasMoney) return message.reply(`Your clan bank only has ${app.common.formatNumber((await app.clans.getRow(scoreRow.clanId)).money)}...`)

			await app.clans.removeMoney(scoreRow.clanId, itemAmnt)
			await app.player.addMoney(message.author.id, itemAmnt)

			app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} withdrew ${app.common.formatNumber(itemAmnt, true)}`)

			return message.reply(`Withdrew **${app.common.formatNumber(itemAmnt)}**\n\nThe clan bank now has **${app.common.formatNumber((await app.clans.getRow(scoreRow.clanId)).money)}**`)
		}

		// withdraw items
		itemAmnt = itemAmnt || 1

		if (!itemName) {
			return message.reply('❌ I don\'t recognize that item.')
		}

		const clanItems = await app.itm.getItemObject(scoreRow.clanId)
		const hasItems = await app.itm.hasItems(clanItems, itemName, itemAmnt)

		if (!hasItems) return message.reply(`Your clan vault has **${clanItems[itemName] !== undefined ? `${clanItems[itemName]}x` : '0'}** ${app.itemdata[itemName].icon}\`${itemName}\`${!clanItems[itemName] || clanItems[itemName] > 1 ? '\'s' : ''}...`)

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), scoreRow)
		const hasSpace = await app.itm.hasSpace(itemCt, itemAmnt)
		if (!hasSpace) return message.reply(`❌ **You don't have enough space in your inventory!** (You need **${itemAmnt}** open slot${itemAmnt > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)

		await app.itm.removeItem(scoreRow.clanId, itemName, itemAmnt)
		await app.itm.addItem(message.author.id, itemName, itemAmnt)

		app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} withdrew ${itemAmnt}x ${itemName}`)

		const clanPow = await app.clans.getClanData(await app.clans.getRow(scoreRow.clanId))

		message.reply(`Withdrew ${itemAmnt}x ${app.itemdata[itemName].icon}\`${itemName}\` from your clan vault.\n\nThe vault now has **${clanItems[itemName] - itemAmnt}x** ${app.itemdata[itemName].icon}\`${itemName}\` and is using **${`${clanPow.usedPower}/${clanPow.currPower}`}** power.`)
	}
}

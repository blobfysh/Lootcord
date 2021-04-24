const SCRAP_BONUS_RATE = 1.5

module.exports = {
	name: 'scrap',
	aliases: [],
	description: 'Get Scrap for your items.',
	long: 'Exchange your items for Scrap! Scrapping your items gives you 1.5x their sell value.',
	args: { item: 'Item to scrap.', amount: '**OPTIONAL** Amount of item to scrap.' },
	examples: ['scrap assault_rifle 2', 'scrap rock 1 assault_rifle 3 crate 2'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const sellItems = app.parse.items(args, 15)
		const sellAmounts = app.parse.numbers(args)

		if (sellItems.length > 1) {
			const userItems = await app.itm.getItemObject(message.author.id)
			let itemAmounts
			let sellPrice = 0

			try {
				itemAmounts = app.itm.combineItems(getItemList(sellItems, sellAmounts))
			}
			catch (err) {
				return message.reply(`❌ You need to specify amounts when scrapping multiple items! For example: \`${prefix}scrap rock 1 assault_rifle 3 crate 2\``)
			}

			for (let i = 0; i < itemAmounts.length; i++) {
				const itemAmnt = itemAmounts[i].split('|')

				if (app.itemdata[itemAmnt[0]].sell === '') {
					return message.reply(`❌ You can't scrap ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`'s!`)
				}
				else if (!userItems[itemAmnt[0]]) {
					return message.reply(`❌ You don't have ${app.common.getA(itemAmnt[0])} ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
				}
				else if (userItems[itemAmnt[0]] < itemAmnt[1]) {
					return message.reply(`❌ You only have **${userItems[itemAmnt[0]]}x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
				}

				sellPrice += Math.floor(app.itemdata[itemAmnt[0]].sell * SCRAP_BONUS_RATE) * parseInt(itemAmnt[1])
			}

			const botMessage = await message.reply(`Scrap ${app.itm.getDisplay(itemAmounts).join(', ')} for **${app.common.formatNumber(sellPrice, false, true)}** Scrap?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const userItems2 = await app.itm.getItemObject(message.author.id)

					for (let i = 0; i < itemAmounts.length; i++) {
						const itemAmnt = itemAmounts[i].split('|')

						if (app.itemdata[itemAmnt[0]].sell === '') {
							return botMessage.edit(`❌ You can't scrap ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`'s!`)
						}
						else if (!userItems2[itemAmnt[0]]) {
							return botMessage.edit(`❌ You don't have a ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
						}
						else if (userItems2[itemAmnt[0]] < itemAmnt[1]) {
							return botMessage.edit(`❌ You only have **${userItems2[itemAmnt[0]]}x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
						}
					}

					const row = await app.player.getRow(message.author.id)
					app.itm.removeItem(message.author.id, itemAmounts)
					app.player.addScrap(message.author.id, sellPrice)

					botMessage.edit(`Successfully scrapped ${app.itm.getDisplay(itemAmounts).join(', ')} for ${app.common.formatNumber(sellPrice, false, true)}.\n\nYou now have **${app.common.formatNumber(row.scrap + sellPrice, false, true)}**.`)
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				botMessage.edit('You didn\'t react in time.')
			}
		}
		else if (sellItems[0]) {
			const sellItem = sellItems[0]
			let sellAmount = sellAmounts[0] || 1

			const userItems = await app.itm.getItemObject(message.author.id)
			const hasItems = await app.itm.hasItems(userItems, sellItem, sellAmount)
			const itemPrice = app.itemdata[sellItem].sell

			if (!hasItems) {
				return message.reply(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have ${app.common.getA(sellItem)} ${app.itemdata[sellItem].icon}\`${sellItem}\`.`)
			}
			else if (itemPrice === '') {
				return message.reply('❌ You can\'t scrap that item!')
			}

			if (sellAmount > 30) {
				sellAmount = 30
			}

			const botMessage = await message.reply(`Scrap **${sellAmount}x** ${app.itemdata[sellItem].icon}\`${sellItem}\` for **${app.common.formatNumber(Math.floor(itemPrice * SCRAP_BONUS_RATE) * sellAmount, false, true)}**?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const vUserItems = await app.itm.getItemObject(message.author.id)
					const vHasItems = await app.itm.hasItems(vUserItems, sellItem, sellAmount)

					if (vHasItems) {
						const row = await app.player.getRow(message.author.id)

						app.player.addScrap(message.author.id, parseInt(Math.floor(itemPrice * SCRAP_BONUS_RATE) * sellAmount))
						app.itm.removeItem(message.author.id, sellItem, sellAmount)
						botMessage.edit(`Successfully scrapped **${sellAmount}x** ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(Math.floor(itemPrice * SCRAP_BONUS_RATE) * sellAmount, false, true)}.\n\nYou now have **${app.common.formatNumber(row.scrap + (Math.floor(itemPrice * SCRAP_BONUS_RATE) * sellAmount), false, true)}**.`)
					}
					else {
						botMessage.edit(vUserItems[sellItem] ? `❌ You don't have enough of that item! You have **${vUserItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`)
					}
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				botMessage.edit('You didn\'t react in time.')
			}
		}
		else {
			message.reply(`You need to enter a valid item to scrap! \`${prefix}scrap <item> <amount>\``)
		}
	}
}

function getItemList(items, amounts) {
	const itemList = []

	for (let i = 0; i < items.length; i++) {
		const sellItem = items[i]
		let sellAmount = amounts[i]

		if (!sellAmount) throw new Error('No amount specified')

		if (sellAmount > 30) sellAmount = 30

		itemList.push(`${sellItem}|${sellAmount}`)
	}

	return itemList
}

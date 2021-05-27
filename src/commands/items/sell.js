const { BUTTONS } = require('../../resources/constants')

exports.command = {
	name: 'sell',
	aliases: [],
	description: 'Sell items for scrap.',
	long: 'Sell items for scrap. Use the `item` command to see how much an item can be sold for. You can also sell multiple items at once, check the examples to see how.',
	args: { item: 'Item to sell.', amount: '**OPTIONAL** Amount of item to sell.' },
	examples: ['sell hazmat_suit 3', 'sell bolt_rifle 2 rock 3 crate 1'],
	permissions: ['sendMessages', 'addReactions', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const sellItems = app.parse.items(args, 15)
		const sellAmounts = app.parse.numbers(args)

		if (sellItems.length > 1) {
			const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
			let itemAmounts
			let sellPrice = 0

			try {
				itemAmounts = app.itm.combineItems(getItemList(sellItems, sellAmounts))
			}
			catch (err) {
				return message.reply(`❌ You need to specify amounts when bulk selling multiple items! For example: \`${prefix}sell rock 1 assault_rifle 3 crate 2\``)
			}

			for (let i = 0; i < itemAmounts.length; i++) {
				const itemAmnt = itemAmounts[i].split('|')

				if (app.itemdata[itemAmnt[0]].sell === '') {
					return message.reply(`❌ You can't sell ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`'s!`)
				}
				else if (!userItems[itemAmnt[0]]) {
					return message.reply(`❌ You have **0x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
				}
				else if (userItems[itemAmnt[0]] < itemAmnt[1]) {
					return message.reply(`❌ You only have **${userItems[itemAmnt[0]]}x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
				}

				sellPrice += app.itemdata[itemAmnt[0]].sell * parseInt(itemAmnt[1])
			}

			const botMessage = await message.reply({
				content: `Sell ${app.itm.getDisplay(itemAmounts).join(', ')} for ${app.common.formatNumber(sellPrice)}?`,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					const userItems2 = await app.itm.getItemObject(message.author.id, serverSideGuildId)

					for (let i = 0; i < itemAmounts.length; i++) {
						const itemAmnt = itemAmounts[i].split('|')

						if (app.itemdata[itemAmnt[0]].sell === '') {
							return confirmed.respond({
								content: `❌ You can't sell ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`'s!`,
								components: []
							})
						}
						else if (!userItems2[itemAmnt[0]]) {
							return confirmed.respond({
								content: `❌ You don't have a ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`,
								components: []
							})
						}
						else if (userItems2[itemAmnt[0]] < itemAmnt[1]) {
							return confirmed.respond({
								content: `❌ You only have **${userItems2[itemAmnt[0]]}x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`,
								components: []
							})
						}
					}

					const row = await app.player.getRow(message.author.id, serverSideGuildId)
					app.itm.removeItem(message.author.id, itemAmounts, null, serverSideGuildId)
					app.player.addMoney(message.author.id, sellPrice, serverSideGuildId)

					await confirmed.respond({
						content: `Successfully sold ${app.itm.getDisplay(itemAmounts).join(', ')} for ${app.common.formatNumber(sellPrice)}.\n\nYou now have ${app.common.formatNumber(row.money + sellPrice)}.`,
						components: []
					})
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				botMessage.edit({
					content: 'You didn\'t react in time.',
					components: []
				})
			}
		}
		else if (sellItems[0]) {
			const sellItem = sellItems[0]
			let sellAmount = sellAmounts[0] || 1

			const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
			const hasItems = await app.itm.hasItems(userItems, sellItem, sellAmount)
			const itemPrice = app.itemdata[sellItem].sell

			if (!hasItems) {
				return message.reply(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You have **0x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.`)
			}

			if (itemPrice !== '') {
				if (sellAmount > 30) {
					sellAmount = 30
				}

				const botMessage = await message.reply({
					content: `Sell ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(itemPrice * sellAmount)}?`,
					components: BUTTONS.confirmation
				})

				try {
					const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

					if (confirmed.customID === 'confirmed') {
						const vUserItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
						const vHasItems = await app.itm.hasItems(vUserItems, sellItem, sellAmount)

						if (vHasItems) {
							const row = await app.player.getRow(message.author.id, serverSideGuildId)

							await app.player.addMoney(message.author.id, parseInt(itemPrice * sellAmount), serverSideGuildId)
							await app.itm.removeItem(message.author.id, sellItem, sellAmount, serverSideGuildId)

							await confirmed.respond({
								content: `Successfully sold ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(itemPrice * sellAmount)}.\n\nYou now have ${app.common.formatNumber(row.money + (itemPrice * sellAmount))}.`,
								components: []
							})
						}
						else {
							await confirmed.respond({
								content: vUserItems[sellItem] ? `❌ You don't have enough of that item! You have **${vUserItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`,
								components: []
							})
						}
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit({
						content: 'You didn\'t react in time.',
						components: []
					})
				}
			}
			else {
				message.reply('❌ You can\'t sell that item!')
			}
		}
		else {
			message.reply(`You need to enter a valid item to sell! \`${prefix}sell <item> <amount>\``)
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

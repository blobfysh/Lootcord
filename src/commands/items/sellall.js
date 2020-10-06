const { ITEM_TYPES } = require('../../resources/constants')

module.exports = {
	name: 'sellall',
	aliases: [''],
	description: 'Sell multiple items at once.',
	long: `Sell all items of a category. If no category is specified, it will sell all items in your inventory. Categories include:\n\n${Object.keys(ITEM_TYPES).map(type => `- ${ITEM_TYPES[type].name}`).join('\n')}`,
	args: { rarity: '**OPTIONAL** Rarity of items you want to sell ie. common, rare...' },
	examples: ['sellall ranged'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const sellItem = args[0] || ''

		if (Object.keys(ITEM_TYPES).includes(sellItem.toLowerCase())) {
			let commonTotal = 0
			let totalAmount = 0

			const itemsToCheck = Object.keys(app.itemdata).filter(item => app.itemdata[item].category === ITEM_TYPES[sellItem.toLowerCase()].type)

			if (itemsToCheck.length < 1) {
				return message.reply(`You need to enter a valid type to sell! \`${prefix}sellall <type>\``)
			}

			const itemRow = await app.itm.getItemObject(message.author.id)
			// iterate array and sell
			for (let i = 0; i < itemsToCheck.length; i++) {
				if (itemRow[itemsToCheck[i]] >= 1) {
					totalAmount += itemRow[itemsToCheck[i]]
					commonTotal += itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
				}
			}
			if (totalAmount <= 0) {
				return message.reply(`❌ You don't have any **${ITEM_TYPES[sellItem.toLowerCase()].type}** items.`)
			}

			const botMessage = await message.reply(`Sell **${totalAmount}x** items (category: \`${ITEM_TYPES[sellItem.toLowerCase()].name}\`) for ${app.common.formatNumber(commonTotal)}?`)
			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const itemRow2 = await app.itm.getItemObject(message.author.id)

					let testAmount = 0 // used to verify user didnt alter inventory while selling.
					let testTotalItems = 0
					for (let i = 0; i < itemsToCheck.length; i++) {
						if (itemRow2[itemsToCheck[i]] >= 1) {
							testTotalItems += itemRow2[itemsToCheck[i]]
							testAmount += itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
						}
					}

					if (testTotalItems === totalAmount && testAmount === commonTotal) {
						const row = await app.player.getRow(message.author.id)

						for (let i = 0; i < itemsToCheck.length; i++) {
							if (itemRow2[itemsToCheck[i]] !== undefined) await app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]])
						}
						await app.player.addMoney(message.author.id, parseInt(commonTotal))

						botMessage.edit(`Successfully sold all ${ITEM_TYPES[sellItem.toLowerCase()].name}.\n\nYou now have ${app.common.formatNumber(row.money + commonTotal)}.`)
					}
					else {
						botMessage.edit('❌ Sellall failed. Your inventory was altered during the sale.')
					}
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				botMessage.edit('❌ Command timed out.')
			}
		}
		else if (sellItem === '') {
			let commonTotal = 0
			let totalAmount = 0

			// filter out limited items and banners
			const itemsToCheck = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category !== 'Banner')

			const itemRow = await app.itm.getItemObject(message.author.id)

			for (let i = 0; i < itemsToCheck.length; i++) {
				if (itemRow[itemsToCheck[i]] >= 1) {
					totalAmount += itemRow[itemsToCheck[i]]
					commonTotal += itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
				}
			}

			if (totalAmount <= 0) {
				return message.reply('❌ You don\'t have any items you can sell.')
			}

			const botMessage = await message.reply(`Sell ${totalAmount}x items for ${app.common.formatNumber(commonTotal)}?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const itemRow2 = await app.itm.getItemObject(message.author.id)

					let testAmount = 0
					let testTotalItems = 0
					for (let i = 0; i < itemsToCheck.length; i++) {
						if (itemRow2[itemsToCheck[i]] >= 1) {
							testTotalItems += itemRow2[itemsToCheck[i]]
							testAmount += itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
						}
					}

					if (testTotalItems === totalAmount && testAmount === commonTotal) {
						for (let i = 0; i < itemsToCheck.length; i++) {
							if (itemRow2[itemsToCheck[i]] !== undefined) await app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]])
						}
						const row = await app.player.getRow(message.author.id)

						await app.player.addMoney(message.author.id, parseInt(commonTotal))

						botMessage.edit(`Successfully sold all items.\n\nYou now have ${app.common.formatNumber(row.money + commonTotal)}.`)
					}
					else {
						botMessage.edit('❌ Sellall failed. Your inventory was altered during the sale.')
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
			message.reply('You need to enter a valid item type to sell! Ex. `sellall ranged`')
		}
	}
}

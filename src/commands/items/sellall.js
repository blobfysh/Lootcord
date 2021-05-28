const { ITEM_TYPES, BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'sellall',
	aliases: [],
	description: 'Sell multiple items at once.',
	long: `Sell all items of a category. If no category is specified, it will sell all items in your inventory. Categories include:\n\n${Object.keys(ITEM_TYPES).map(type => `- ${ITEM_TYPES[type].name}`).join('\n')}`,
	args: { rarity: '**OPTIONAL** Rarity of items you want to sell ie. common, rare...' },
	examples: ['sellall ranged'],
	permissions: ['sendMessages', 'addReactions', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const sellItem = args[0] || ''

		if (Object.keys(ITEM_TYPES).includes(sellItem.toLowerCase())) {
			let commonTotal = 0
			let totalAmount = 0

			const itemsToCheck = Object.keys(app.itemdata).filter(item => app.itemdata[item].category === ITEM_TYPES[sellItem.toLowerCase()].type)

			if (itemsToCheck.length < 1) {
				return reply(message, `You need to enter a valid type to sell! \`${prefix}sellall <type>\``)
			}

			const itemRow = await app.itm.getItemObject(message.author.id, serverSideGuildId)
			// iterate array and sell
			for (let i = 0; i < itemsToCheck.length; i++) {
				if (itemRow[itemsToCheck[i]] >= 1) {
					totalAmount += itemRow[itemsToCheck[i]]
					commonTotal += itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
				}
			}
			if (totalAmount <= 0) {
				return reply(message, `❌ You don't have any **${ITEM_TYPES[sellItem.toLowerCase()].type}** items.`)
			}

			const botMessage = await reply(message, {
				content: `Sell **${totalAmount}x** items (category: \`${ITEM_TYPES[sellItem.toLowerCase()].name}\`) for ${app.common.formatNumber(commonTotal)}?`,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					const itemRow2 = await app.itm.getItemObject(message.author.id, serverSideGuildId)

					let testAmount = 0 // used to verify user didnt alter inventory while selling.
					let testTotalItems = 0
					for (let i = 0; i < itemsToCheck.length; i++) {
						if (itemRow2[itemsToCheck[i]] >= 1) {
							testTotalItems += itemRow2[itemsToCheck[i]]
							testAmount += itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
						}
					}

					if (testTotalItems === totalAmount && testAmount === commonTotal) {
						const row = await app.player.getRow(message.author.id, serverSideGuildId)

						for (let i = 0; i < itemsToCheck.length; i++) {
							if (itemRow2[itemsToCheck[i]] !== undefined) await app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]], serverSideGuildId)
						}
						await app.player.addMoney(message.author.id, parseInt(commonTotal), serverSideGuildId)

						await confirmed.respond({
							content: `Successfully sold all ${ITEM_TYPES[sellItem.toLowerCase()].name}.\n\nYou now have ${app.common.formatNumber(row.money + commonTotal)}.`,
							components: []
						})
					}
					else {
						await confirmed.respond({
							content: '❌ Sellall failed. Your inventory was altered during the sale.',
							components: []
						})
					}
				}
				else {
					await botMessage.delete()
				}
			}
			catch (err) {
				await botMessage.edit({
					content: '❌ Command timed out.',
					components: []
				})
			}
		}
		else if (sellItem === '') {
			let commonTotal = 0
			let totalAmount = 0

			// filter out limited items and banners
			const itemsToCheck = Object.keys(app.itemdata).filter(item => !app.itemdata[item].isSpecial && app.itemdata[item].category !== 'Banner')

			const itemRow = await app.itm.getItemObject(message.author.id, serverSideGuildId)

			for (let i = 0; i < itemsToCheck.length; i++) {
				if (itemRow[itemsToCheck[i]] >= 1) {
					totalAmount += itemRow[itemsToCheck[i]]
					commonTotal += itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell
				}
			}

			if (totalAmount <= 0) {
				return reply(message, '❌ You don\'t have any items you can sell.')
			}

			const botMessage = await reply(message, {
				content: `Sell ${totalAmount}x items for ${app.common.formatNumber(commonTotal)}?`,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					const itemRow2 = await app.itm.getItemObject(message.author.id, serverSideGuildId)

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
							if (itemRow2[itemsToCheck[i]] !== undefined) await app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]], serverSideGuildId)
						}
						const row = await app.player.getRow(message.author.id, serverSideGuildId)

						await app.player.addMoney(message.author.id, parseInt(commonTotal), serverSideGuildId)

						await confirmed.respond({
							content: `Successfully sold all items.\n\nYou now have ${app.common.formatNumber(row.money + commonTotal)}.`,
							components: []
						})
					}
					else {
						await confirmed.respond({
							content: '❌ Sellall failed. Your inventory was altered during the sale.',
							components: []
						})
					}
				}
				else {
					await botMessage.delete()
				}
			}
			catch (err) {
				await botMessage.edit({
					content: '❌ Command timed out.',
					components: []
				})
			}
		}
		else {
			await reply(message, 'You need to enter a valid item type to sell! Ex. `sellall ranged`')
		}
	}
}

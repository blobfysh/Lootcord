const shortid = require('shortid')

exports.command = {
	name: 'buy',
	aliases: ['purchase'],
	description: 'Purchase items and games with currency.',
	long: 'Purchase items with currency. Check the `shop` to see what can be bought.',
	args: { item: 'Item to buy.', amount: '**OPTIONAL** Amount of items to purchase.' },
	examples: ['buy crate 2'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const shopItems = await getShopData(app)
		let buyItem = app.parse.items(args)[0]
		let buyAmount = app.parse.numbers(args)[0] || 1

		if (buyItem) {
			const currency = app.itemdata[buyItem].buy.currency
			const itemPrice = app.itemdata[buyItem].buy.amount

			if (itemPrice === undefined) {
				return message.reply(`That item is not for sale, try checking the black market instead: \`${prefix}bm ${buyItem}\``)
			}

			if (buyAmount > 20) buyAmount = 20

			if (currency === 'money') {
				const botMessage = await message.channel.createMessage(`Purchase ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\` for **${app.common.formatNumber(itemPrice * buyAmount)}** Lootcoin?`)

				try {
					const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

					if (confirmed) {
						const row = await app.player.getRow(message.author.id, serverSideGuildId)
						const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), row)
						const hasSpace = await app.itm.hasSpace(itemCt, buyAmount)

						if (row.money < itemPrice * buyAmount) {
							return botMessage.edit(`You don't have enough Lootcoin for that purchase! You only have **${app.common.formatNumber(row.money)}**.`)
						}
						if (!hasSpace && !app.itemdata[buyItem].isBanner) {
							return botMessage.edit(`❌ **You don't have enough space in your inventory!** (You need **${buyAmount}** open slot${buyAmount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
						}

						await app.player.removeMoney(message.author.id, itemPrice * buyAmount, serverSideGuildId)
						await app.itm.addItem(message.author.id, buyItem, buyAmount, serverSideGuildId)

						botMessage.edit(`Successfully bought ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\`!\n\nYou now have ${app.common.formatNumber(row.money - (itemPrice * buyAmount))}.`)
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit('You ran out of time.')
				}
			}
			else if (currency === 'scrap') {
				const botMessage = await message.channel.createMessage(`Purchase ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\` for **${app.common.formatNumber(itemPrice * buyAmount, false, true)}** Scrap?`)

				try {
					const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

					if (confirmed) {
						const row = await app.player.getRow(message.author.id, serverSideGuildId)
						const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), row)
						const hasSpace = await app.itm.hasSpace(itemCt, buyAmount)

						if (row.scrap < itemPrice * buyAmount) {
							return botMessage.edit(`You don't have enough Scrap for that purchase! You only have **${app.common.formatNumber(row.scrap, false, true)}**.`)
						}
						if (!hasSpace && !app.itemdata[buyItem].isBanner) {
							return botMessage.edit(`❌ **You don't have enough space in your inventory!** (You need **${buyAmount}** open slot${buyAmount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
						}

						await app.player.removeScrap(message.author.id, itemPrice * buyAmount, serverSideGuildId)
						await app.itm.addItem(message.author.id, buyItem, buyAmount, serverSideGuildId)

						botMessage.edit(`Successfully bought ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\`!\n\nYou now have ${app.common.formatNumber(row.scrap - (itemPrice * buyAmount), false, true)}.`)
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit('You ran out of time.')
				}
			}
			else {
				const botMessage = await message.channel.createMessage(`Purchase ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\` for ${`${itemPrice * buyAmount}x ${app.itemdata[currency].icon}\`${currency}\``}?`)

				try {
					const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

					if (confirmed) {
						// if user bought 3 rocks at 5 tokens each, they would need 3 - 15 = -12 space in their inventory
						// if they had 20/10 slots at time of purchasing, this would return true because 20 - 12 = 8/10 slots
						const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
						const itemCt = await app.itm.getItemCount(userItems, await app.player.getRow(message.author.id, serverSideGuildId))
						const hasItems = await app.itm.hasItems(userItems, currency, itemPrice * buyAmount)
						const hasSpace = await app.itm.hasSpace(itemCt, buyAmount - (buyAmount * itemPrice))

						if (!hasItems) {
							return botMessage.edit(`You are missing the following items needed to purchase this: ${itemPrice * buyAmount}x ${app.itemdata[currency].icon}\`${currency}\``)
						}
						if (!hasSpace) {
							return botMessage.edit(`❌ **You don't have enough space in your inventory!** (You need **${buyAmount - (buyAmount * itemPrice)}** open slot${buyAmount - (buyAmount * itemPrice) > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
						}

						await app.itm.removeItem(message.author.id, currency, itemPrice * buyAmount, serverSideGuildId)
						await app.itm.addItem(message.author.id, buyItem, buyAmount, serverSideGuildId)

						botMessage.edit(`Successfully bought ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\`!`)
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit('You ran out of time.')
				}
			}
		}
		else if (args.map(arg => arg.toLowerCase()).includes('scrap')) {
			const row = await app.player.getRow(message.author.id, serverSideGuildId)

			if (args[1] && args[1].toLowerCase() === 'all') {
				buyAmount = row.money
			}

			if (buyAmount > 1000000) buyAmount = 1000000

			if (buyAmount < 100) {
				return message.reply(`❌ Please specify an amount of at least **${app.common.formatNumber(100)}** to convert!`)
			}

			const scrapPrice = buyAmount

			const botMessage = await message.channel.createMessage(`Trade **${app.common.formatNumber(scrapPrice)}** Lootcoin for **${app.common.formatNumber(buyAmount, false, true)}** Scrap?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const verifyRow = await app.player.getRow(message.author.id, serverSideGuildId)

					if (verifyRow.money < scrapPrice) {
						return botMessage.edit(`You don't have enough Lootcoin for that purchase! You only have **${app.common.formatNumber(verifyRow.money)}**.`)
					}

					await app.player.removeMoney(message.author.id, scrapPrice, serverSideGuildId)
					await app.player.addScrap(message.author.id, buyAmount, serverSideGuildId)

					botMessage.edit(`Successfully traded **${app.common.formatNumber(scrapPrice)}** Lootcoin for **${app.common.formatNumber(buyAmount, false, true)}** Scrap.\n\nYou now have **${app.common.formatNumber(verifyRow.money - scrapPrice)}** Lootcoin and **${app.common.formatNumber(verifyRow.scrap + buyAmount, false, true)}** Scrap`)
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				console.log(err)
				botMessage.edit('You ran out of time.')
			}
		}
		else if (shopItems[args[0]] !== undefined) {
			// code for buying game here
			buyItem = args[0]
			const itemAmount = shopItems[buyItem].itemAmount
			const currency = shopItems[buyItem].itemCurrency
			const itemPrice = shopItems[buyItem].itemPrice
			const itemName = shopItems[buyItem].itemDisplay
			buyAmount = 1

			if (serverSideGuildId) {
				return message.reply('❌ Global shop deals are not available for server-side economies.')
			}
			else if (itemAmount <= 0) {
				return message.reply('That item is sold out! 😞')
			}

			if (currency === 'money') {
				const botMessage = await message.channel.createMessage(`Purchase \`${itemName}\` for ${app.common.formatNumber(itemPrice)}?`)

				try {
					const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

					if (confirmed) {
						const row = await app.player.getRow(message.author.id)

						if (row.money < itemPrice) {
							return botMessage.edit(`You don't have enough Lootcoin for that purchase! You only have **${app.common.formatNumber(row.money)}**.`)
						}

						await app.player.removeMoney(message.author.id, itemPrice)

						boughtGame(app, message.author, shopItems[buyItem])
						botMessage.edit(`Successfully bought ${itemName}!`)
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit('You ran out of time.')
				}
			}
			else if (currency === 'scrap') {
				const botMessage = await message.channel.createMessage(`Purchase \`${itemName}\` for ${app.common.formatNumber(itemPrice, false, true)}?`)

				try {
					const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

					if (confirmed) {
						const row = await app.player.getRow(message.author.id)

						if (row.scrap < itemPrice) {
							return botMessage.edit(`You don't have enough Scrap for that purchase! You only have **${app.common.formatNumber(row.scrap, false, true)}**.`)
						}

						await app.player.removeScrap(message.author.id, itemPrice)

						boughtGame(app, message.author, shopItems[buyItem])
						botMessage.edit(`Successfully bought ${itemName}!`)
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit('You ran out of time.')
				}
			}
			else {
				const botMessage = await message.channel.createMessage(`Purchase \`${itemName}\` for ${itemPrice}x ${app.itemdata[currency].icon}\`${currency}\`?`)

				try {
					const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

					if (confirmed) {
						const hasItems = await app.itm.hasItems(await app.itm.getItemObject(message.author.id), currency, itemPrice)

						if (!hasItems) {
							return botMessage.edit(`You are missing the following items needed to purchase this: ${itemPrice}x ${app.itemdata[currency].icon}\`${currency}\``)
						}

						await app.itm.removeItem(message.author.id, currency, itemPrice)

						boughtGame(app, message.author, shopItems[buyItem])
						botMessage.edit(`Successfully bought ${itemName}!`)
					}
					else {
						botMessage.delete()
					}
				}
				catch (err) {
					botMessage.edit('You ran out of time.')
				}
			}
		}
		else if (shortid.isValid(args[0]) && await app.bm.getListingInfo(args[0])) {
			buyItem = args[0]

			if (serverSideGuildId) {
				return message.reply('❌ The black market is disabled for server-side economies.')
			}
			else if (await app.cd.getCD(message.author.id, 'tradeban')) {
				return message.reply('❌ You are trade banned and cannot use the black market.')
			}
			else if (Math.floor((message.author.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
				return message.reply('❌ Your Discord account must be at least 30 days old to use the black market! This helps us prevent alt abuse. 😭')
			}
			else if ((await app.player.getRow(message.author.id)).bmLimit >= 10) {
				return message.reply('❌ You are limited to purchasing **10** black market listings a day. This limit helps prevent a single player from purchasing all items on the market.')
			}

			const listInfo = await app.bm.getListingInfo(buyItem)
			const botMessage = await message.channel.createMessage(`Purchase ${listInfo.amount}x ${app.itemdata[listInfo.item].icon}\`${listInfo.item}\` for **${app.common.formatNumber(listInfo.price)}** Lootcoin?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const row = await app.player.getRow(message.author.id)
					const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), row)
					const hasSpace = await app.itm.hasSpace(itemCt, listInfo.amount)

					if (row.money < listInfo.price) {
						return botMessage.edit(`❌ You don't have enough Lootcoin! You only have **${app.common.formatNumber(row.money)}**`)
					}
					if (!hasSpace) {
						return botMessage.edit(`❌ **You don't have enough space in your inventory!** (You need **${listInfo.amount}** open slot${listInfo.amount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
					}
					if (!await app.bm.getListingInfo(listInfo.listingId)) {
						return botMessage.edit('❌ That listing already sold!')
					}
					if (row.bmLimit >= 10) {
						return botMessage.edit('❌ You are limited to purchasing **10** black market listings a day. This limit is to prevent players from purchasing all items on the market.')
					}

					app.bm.soldItem(listInfo)
					await app.query(`INSERT INTO blackmarket_transactions (
                        listingId,
                        sellerId,
                        buyerId,
                        itemName,
                        price,
                        quantity,
                        pricePer,
                        soldDate)
                        VALUES (
                            ?, ?, ?, ?, ?, ?, ?, NOW()
                        )`, [listInfo.listingId,
						listInfo.sellerId,
						message.author.id,
						listInfo.item,
						listInfo.price,
						listInfo.amount,
						listInfo.pricePer
					])
					await app.player.removeMoney(message.author.id, listInfo.price)
					await app.itm.addItem(message.author.id, listInfo.item, listInfo.amount)
					await app.query('UPDATE scores SET bmLimit = bmLimit + 1 WHERE userId = ?', [message.author.id])

					const bmLogEmbed = new app.Embed()
						.setTitle('BM Listing Sold')
						.setTimestamp()
						.setColor(2713128)
						.addField('Buyer', `${message.author.username}#${message.author.discriminator} ID: \`\`\`\n${message.author.id}\`\`\``)
						.addField('Seller', `\`\`\`\n${listInfo.sellerId}\`\`\``)
						.addField('List Duration (how long it was listed)', app.cd.convertTime(Date.now() - listInfo.listTime))
						.addField('Item Sold', `${listInfo.amount}x \`${listInfo.item}\``, true)
						.addField('Price', app.common.formatNumber(listInfo.price), true)
						.setFooter('Make sure listing isn\'t faked to transfer money')

					if (Date.now() - listInfo.listTime <= 1000 * 300) {
						bmLogEmbed.setColor(16734296)
						bmLogEmbed.setTitle('BM Listing Sold (Flagged)')
						bmLogEmbed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/triangular-flag-on-post_1f6a9.png')
					}

					app.messager.messageLogs(bmLogEmbed)

					botMessage.edit(`Successfully bought ${listInfo.amount}x ${app.itemdata[listInfo.item].icon}\`${listInfo.item}\`!`)
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				console.log(err)
				botMessage.edit('You ran out of time.')
			}
		}
		else if (args[0] && args[0].toLowerCase() === 'lootcoin') {
			message.reply('You can\'t buy Lootcoin directly using Scrap, you should instead check the daily scrap deals in the `shop`!')
		}
		else {
			message.reply(`You need to enter a valid item to buy! \`${prefix}buy <item> <amount>\``)
		}
	}
}

async function boughtGame(app, user, itemRow) {
	app.query(`UPDATE shopdata SET itemAmount = itemAmount - 1 WHERE itemName = '${itemRow.itemName}'`)

	if (itemRow.item && itemRow.item !== '') {
		return app.itm.addItem(user.id, itemRow.item, 1)
	}

	try {
		const buyerEmbed = new app.Embed()
			.setTitle('✅ Shop Item Purchased!')
			.setDescription('The moderators have received confirmation that you purchased a product from the shop and will respond with your key soon.')
			.setFooter('Please do not message asking "Where is my code?" unless at least 12 hours have passed. We have the right to cancel this purchase if we suspect you of cheating.')
			.setTimestamp()

		const dm = await user.getDMChannel()
		dm.createMessage(buyerEmbed)
	}
	catch (err) {
		console.warn(err)
		// user has DM's disabled
	}

	const soldEmbed = new app.Embed()
		.setTitle('✅ Shop Item Purchased')
		.addField('Product Sold', itemRow.itemDisplay)
		.addField('Buyer', `${user.username}#${user.discriminator} ID: \`\`\`\n${user.id}\`\`\``)

	app.messager.messageMods(soldEmbed)
	console.warn(`A shop item (${itemRow.itemName}) was sold to id: ${user.id}`)
}

async function getShopData(app) {
	const itemRows = await app.query('SELECT * FROM shopdata')
	let itemCount = 0
	const itemData = {}

	for (const itemRow of itemRows) {
		if (itemRow !== null) {
			itemData[itemRow.itemName] = itemRow
			itemCount += 1
		}
	}

	if (itemCount === 0) {
		return false
	}

	return itemData
}

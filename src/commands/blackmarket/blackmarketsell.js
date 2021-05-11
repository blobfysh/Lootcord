const shortid = require('shortid')
const listing_fee = 0.10
const max_listings = 15

exports.command = {
	name: 'blackmarketsell',
	aliases: ['blackmarketlist', 'bmlist', 'bmsell', 'bms'],
	description: 'Add a new listing to the Black Market.',
	long: 'Sell an item of your own on the Black Market for other players to buy! Listing an item has a fee of 10% of the price.',
	args: {},
	examples: ['bmlist box 1 2000', 'bmlist'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	globalEconomyOnly: true,

	async execute(app, message, { args, prefix, guildInfo }) {
		const itemName = app.parse.items(args)[0]
		const itemAmnt = app.parse.numbers(args)[0]
		const itemCost = app.parse.numbers(args)[1]

		if (await app.cd.getCD(message.author.id, 'tradeban')) {
			return message.reply('❌ You are trade banned.')
		}
		else if (Math.floor((message.author.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
			return message.reply('❌ Your Discord account must be at least 30 days old to use the black market! This helps us prevent alt abuse. 😭')
		}
		else if ((await app.query(`SELECT * FROM blackmarket WHERE sellerId = ${message.author.id}`)).length >= max_listings) {
			return message.reply(`❌ You have ${max_listings} listings on the market already! Remove some or wait for them to sell.`)
		}
		else if (itemName && itemAmnt && itemCost) {
			// skip listing process...
			const userItems = await app.itm.getItemObject(message.author.id)

			if (!await app.itm.hasItems(userItems, itemName, 1)) {
				return message.reply('You don\'t have that item.')
			}
			else if (!app.itemdata[itemName].canBeStolen) {
				return message.reply('That item cannot be sold on the market!')
			}
			else if (itemAmnt >= 2147483647) {
				return message.reply('Please enter a lower value.')
			}
			else if (!await app.itm.hasItems(userItems, itemName, itemAmnt)) {
				return message.reply('You don\'t have enough of that item.')
			}
			else if (itemCost >= 2147483647) {
				return message.reply('Please enter a lower price o.o')
			}
			else if (itemCost < 100) {
				return message.reply(`Please enter a higher price! Minimum **${app.common.formatNumber(100)}**`)
			}
			else if (itemCost <= (app.itemdata[itemName].sell * itemAmnt)) {
				return message.reply('You can `sell` that for more money! You should list for more money, or sell them to the bot instead.')
			}

			const bmEmbed = new app.Embed()
				.setTitle('List an item on the Black Market')
				.addField('Item:', `${app.itemdata[itemName].icon}\`${itemName}\``, true)
				.addField('Quantity:', itemAmnt, true)
				.addField('Price:', `**${app.common.formatNumber(itemCost)}**`)
				.setColor(13451564)

			const listingFee = Math.floor(itemCost * listing_fee)
			const botMessage = await message.channel.createMessage({ content: `<@${message.author.id}>, This will cost **${app.common.formatNumber(listingFee)}** (${listing_fee * 100}%) to list. Are you sure?`, embed: bmEmbed.embed })

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const row = await app.player.getRow(message.author.id)

					if (row.money < listingFee) {
						return botMessage.edit({ content: `Listing failed! You can't afford the **${app.common.formatNumber(listingFee)}** fee. You only have **${app.common.formatNumber(row.money)}**`, embed: null })
					}
					else if (!await app.itm.hasItems(await app.itm.getItemObject(message.author.id), itemName, itemAmnt)) {
						return botMessage.edit({ content: `Listing failed! You don't have **${itemAmnt}** \`${itemName}\`'s.`, embed: null })
					}
					await app.player.removeMoney(message.author.id, listingFee)
					await app.itm.removeItem(message.author.id, itemName, itemAmnt)

					const listingId = await listItem(app, message, itemName, itemAmnt, itemCost)

					return botMessage.edit({ content: `Success! Your ${app.itemdata[itemName].icon}\`${itemName}\` was listed with the ID: \`${listingId}\`.`, embed: null })
				}

				botMessage.delete()
			}
			catch (e) {
				botMessage.edit({ content: '❌ You didn\'t react in time!', embed: null })
			}
		}
		else {
			// step by step listing...
			let item, amount, price

			const bmEmbed = new app.Embed()
				.setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
				.setTitle('List an item on the Black Market')
				.setDescription('Enter the name of the item you would like to list:')
				.setFooter('Type cancel to stop the command.')
				.setColor(13451564)

			try {
				const collectorObj = app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => m.author.id === message.author.id, { time: 60000 })

				let botMessage = await message.channel.createMessage(bmEmbed)

				collectorObj.collector.on('collect', async m => {
					const newArgs = m.content.split(/ +/)
					const newItem = app.parse.items(newArgs)[0]

					if (m.content.toLowerCase() === 'cancel' || m.content.toLowerCase() === 'stop') {
						app.msgCollector.stopCollector(collectorObj)

						return message.reply('Listing canceled.')
					}
					else if (newItem && !item) {
						if (!await app.itm.hasItems(await app.itm.getItemObject(message.author.id), newItem, 1)) {
							return m.channel.createMessage('You don\'t have that item.')
						}
						else if (!app.itemdata[newItem].canBeStolen) {
							return m.channel.createMessage('That item cannot be sold on the market!')
						}

						item = newItem
						bmEmbed.addField('Item:', `${app.itemdata[item].icon} \`${item}\``, true)
						bmEmbed.setDescription('Enter the amount to sell:')
						botMessage = await message.channel.createMessage(bmEmbed)
						return
					}
					else if (!item) {
						return m.channel.createMessage('I don\'t recognize that item.')
					}

					const newAmnt = app.parse.numbers(newArgs)[0]

					if (newAmnt && !amount) {
						if (newAmnt >= 2147483647) {
							return m.channel.createMessage('Please enter a lower value.')
						}
						else if (!await app.itm.hasItems(await app.itm.getItemObject(message.author.id), item, newAmnt)) {
							return m.channel.createMessage('You don\'t have enough of that item.')
						}

						amount = newAmnt
						bmEmbed.addField('Quantity:', amount, true)
						bmEmbed.setDescription(`Enter the price for all **${amount}**:`)
						botMessage = await message.channel.createMessage(bmEmbed)
						return
					}
					else if (!amount) {
						return m.channel.createMessage('Please enter a valid amount.')
					}

					const newCost = app.parse.numbers(newArgs)[0]

					if (newCost && !price) {
						if (newCost >= 2147483647) {
							return m.channel.createMessage('Please enter a lower value.')
						}
						else if (newCost < 100) {
							return m.channel.createMessage(`Please enter a higher price! Minimum **${app.common.formatNumber(100)}**`)
						}
						else if (newCost <= (app.itemdata[item].sell * amount)) {
							return m.channel.createMessage('You can `sell` that for more money! You should list for more money, or sell them using the sell command instead.')
						}

						price = newCost
						const listingFee = Math.floor(price * listing_fee)

						bmEmbed.addField('Price:', app.common.formatNumber(price))
						bmEmbed.setDescription(`List **${amount}x** \`${item}\` for ${app.common.formatNumber(price)}?`)
						botMessage = await message.channel.createMessage({ content: `<@${message.author.id}>, This will cost ${app.common.formatNumber(listingFee)} to list. Are you sure?`, embed: bmEmbed.embed })
						app.msgCollector.stopCollector(collectorObj)
						try {
							const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

							if (confirmed) {
								const row = await app.player.getRow(message.author.id)
								if (row.money < listingFee) {
									return botMessage.edit({ content: `Listing failed! You can't afford the **${app.common.formatNumber(listingFee)}** fee. You only have **${app.common.formatNumber(row.money)}**`, embed: null })
								}
								else if (!await app.itm.hasItems(await app.itm.getItemObject(message.author.id), item, amount)) {
									return botMessage.edit({ content: `Listing failed! You don't have **${amount}** \`${item}\`'s.`, embed: null })
								}

								await app.player.removeMoney(message.author.id, listingFee)
								await app.itm.removeItem(message.author.id, item, amount)

								const listingId = await listItem(app, message, item, amount, price)

								return botMessage.edit({ content: `Success! Your ${app.itemdata[item].icon}\`${item}\` was listed with the ID: \`${listingId}\`.`, embed: null })
							}

							botMessage.delete()
						}
						catch (e) {
							botMessage.edit({ content: '❌ You didn\'t react in time!', embed: null })
						}
					}
				})
				collectorObj.collector.on('end', reason => {
					if (reason === 'time') {
						botMessage.edit({ content: '❌ Command timed out.', embed: null })
					}
				})
			}
			catch (err) {
				return message.reply('❌ There was an error starting the command, you may have another command waiting for your input. If you believe this is an issue with the bot, join the support `discord`.')
			}
		}
	}
}

async function listItem(app, message, item, amount, price) {
	const listId = shortid.generate()
	const pricePer = Math.floor(price / amount)

	await app.query(insertBMSQL, [
		listId,
		message.author.id,
		item,
		price,
		amount,
		pricePer,
		message.author.username,
		new Date().getTime()
	])

	return listId
}

const insertBMSQL = `
INSERT IGNORE INTO blackmarket (
    listingId,
    sellerId,
    itemName,
    price,
    quantity,
    pricePer,
    sellerName,
    listTime)
    VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?
    )
`

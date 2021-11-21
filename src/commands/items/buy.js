const shortid = require('shortid')
const { reply } = require('../../utils/messageUtils')
const { BUTTONS } = require('../../resources/constants')

const active = new Set()

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

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		let buyItem = app.parse.items(args)[0]
		let buyAmount = app.parse.numbers(args)[0] || 1

		if (active.has(message.author.id)) {
			return reply(message, '❌ You already have a `buy` command active.')
		}
		else if (buyItem) {
			const sale = (await app.query('SELECT * FROM sales WHERE item = ?', buyItem))[0]
			const itemPrice = sale ? sale.price : app.itemdata[buyItem].buy.amount

			if (itemPrice === undefined) {
				return reply(message, `That item is not for sale, try checking the black market instead: \`${prefix}bm ${buyItem}\``)
			}

			if (buyAmount > 20) buyAmount = 20

			active.add(message.author.id)

			const botMessage = await message.channel.createMessage({
				content: `Purchase ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\` for **${app.common.formatNumber(itemPrice * buyAmount)}**?`,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					const row = await app.player.getRow(message.author.id, serverSideGuildId)
					const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), row)
					const hasSpace = await app.itm.hasSpace(itemCt, buyAmount)

					if (row.money < itemPrice * buyAmount) {
						return confirmed.respond({
							content: `❌ You don't have enough scrap! You only have **${app.common.formatNumber(row.money)}**`,
							components: []
						})
					}
					else if (!hasSpace && !app.itemdata[buyItem].isBanner) {
						return confirmed.respond({
							content: `❌ **You don't have enough space in your inventory!** (You need **${buyAmount}** open slot${buyAmount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`,
							components: []
						})
					}
					else if (app.itemdata[buyItem].isBanner && itemCt.bannerCt + buyAmount > 1000) {
						return confirmed.respond({
							content: '❌ **Buying that will put you over the banner limit!** (1,000)',
							components: []
						})
					}

					await app.player.removeMoney(message.author.id, itemPrice * buyAmount, serverSideGuildId)
					await app.itm.addItem(message.author.id, buyItem, buyAmount, serverSideGuildId)

					await confirmed.respond({
						content: `Successfully bought ${buyAmount}x ${app.itemdata[buyItem].icon}\`${buyItem}\`!\n\nYou now have ${app.common.formatNumber(row.money - (itemPrice * buyAmount))}.`,
						components: []
					})
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				await botMessage.edit({
					content: '❌ Command timed out.',
					components: []
				})
			}
			finally {
				active.delete(message.author.id)
			}
		}
		else if (shortid.isValid(args[0]) && await app.bm.getListingInfo(args[0])) {
			buyItem = args[0]

			if (serverSideGuildId) {
				return reply(message, '❌ The black market is disabled for server-side economies.')
			}
			else if (await app.cd.getCD(message.author.id, 'tradeban')) {
				return reply(message, '❌ You are trade banned and cannot use the black market.')
			}
			else if (Math.floor((message.author.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
				return reply(message, '❌ Your Discord account must be at least 30 days old to use the black market! This helps us prevent alt abuse. 😭')
			}
			else if ((await app.player.getRow(message.author.id)).bmLimit >= 10) {
				return reply(message, '❌ You are limited to purchasing **10** black market listings a day. This limit helps prevent a single player from purchasing all items on the market.')
			}

			active.add(message.author.id)

			const listInfo = await app.bm.getListingInfo(buyItem)
			const botMessage = await message.channel.createMessage({
				content: `Purchase ${listInfo.amount}x ${app.itemdata[listInfo.item].icon}\`${listInfo.item}\` for **${app.common.formatNumber(listInfo.price)}**?`,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					const row = await app.player.getRow(message.author.id)
					const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), row)
					const hasSpace = await app.itm.hasSpace(itemCt, listInfo.amount)

					if (row.money < listInfo.price) {
						return confirmed.respond({
							content: `❌ You don't have enough scrap! You only have **${app.common.formatNumber(row.money)}**`,
							components: []
						})
					}
					if (!hasSpace) {
						return confirmed.respond({
							content: `❌ **You don't have enough space in your inventory!** (You need **${listInfo.amount}** open slot${listInfo.amount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`,
							components: []
						})
					}
					if (!await app.bm.getListingInfo(listInfo.listingId)) {
						return confirmed.respond({
							content: '❌ That listing already sold!',
							components: []
						})
					}
					if (row.bmLimit >= 10) {
						return confirmed.respond({
							content: '❌ You are limited to purchasing **10** black market listings a day. This limit is to prevent players from purchasing all items on the market.',
							components: []
						})
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

					await confirmed.respond({
						content: `Successfully bought ${listInfo.amount}x ${app.itemdata[listInfo.item].icon}\`${listInfo.item}\`!`,
						components: []
					})
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				console.log(err)
				botMessage.edit({
					content: '❌ Command timed out.',
					components: []
				})
			}
			finally {
				active.delete(message.author.id)
			}
		}
		else {
			await reply(message, `You need to enter a valid item to buy! \`${prefix}buy <item> <amount>\``)
		}
	}
}

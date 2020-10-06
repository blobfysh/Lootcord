module.exports = {
	name: 'recycle',
	aliases: [''],
	description: 'Break items down into parts!',
	long: 'Recycle items for components. You can check what an item will recycle to with the `item` command.',
	args: { item: 'Item to recycle.', amount: '**OPTIONAL** Amount of item to recycle.' },
	examples: ['recycle semi_rifle 2'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const sellItem = app.parse.items(args)[0]
		let sellAmount = app.parse.numbers(args)[0] || 1

		if (sellItem) {
			if (!app.itemdata[sellItem].recyclesTo.materials.length) {
				return message.reply('That item cannot be recycled.')
			}

			if (sellAmount > 20) sellAmount = 20

			const itemMats = getItemMats(app.itemdata[sellItem].recyclesTo.materials, sellAmount).sort(app.itm.sortItemsHighLow.bind(app))

			const embedInfo = new app.Embed()
				.setDescription(`Recycle **${sellAmount}x** ${app.itemdata[sellItem].icon}\`${sellItem}\` for:\n\n${app.itm.getDisplay(itemMats).join('\n')}`)
				.setColor('#4CAD4C')
				.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/601373249753841665/recycle.png')
				.setFooter(`You will need ${app.itm.getTotalItmCountFromList(itemMats) - sellAmount} open slots in your inventory to recycle this.`)

			const botMessage = await message.channel.createMessage({ content: `<@${message.author.id}>`, embed: embedInfo.embed })

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const userItems = await app.itm.getItemObject(message.author.id)
					const itemCt = await app.itm.getItemCount(userItems, await app.player.getRow(message.author.id))

					if (!await app.itm.hasItems(userItems, sellItem, sellAmount)) {
						embedInfo.setColor(16734296)
						embedInfo.embed.thumbnail = undefined
						embedInfo.embed.footer = undefined
						embedInfo.setDescription(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`)
						return botMessage.edit(embedInfo)
					}

					if (!await app.itm.hasSpace(itemCt, app.itm.getTotalItmCountFromList(itemMats) - sellAmount)) {
						embedInfo.setColor(16734296)
						embedInfo.embed.thumbnail = undefined
						embedInfo.embed.footer = undefined
						embedInfo.setDescription(`❌ **You don't have enough space in your inventory!** (You need **${app.itm.getTotalItmCountFromList(itemMats) - sellAmount}** open slot${app.itm.getTotalItmCountFromList(itemMats) - sellAmount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
						return botMessage.edit(embedInfo)
					}

					await app.itm.addItem(message.author.id, itemMats)
					await app.itm.removeItem(message.author.id, sellItem, sellAmount)

					embedInfo.setColor(9043800)
					embedInfo.setDescription(`Successfully recycled **${sellAmount}x** ${app.itemdata[sellItem].icon}\`${sellItem}\` for:\n\n${app.itm.getDisplay(itemMats).join('\n')}`)
					botMessage.edit(embedInfo)
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				const errorEmbed = new app.Embed()
					.setColor(16734296)
					.setDescription('❌ Command timed out.')
				botMessage.edit(errorEmbed)
			}
		}
		else {
			message.reply(`I don't recognize that item. \`${prefix}recycle <item>\``)
		}
	}
}

function getItemMats(itemMats, recycleAmount) {
	const itemPrice = []

	for (let i = 0; i < itemMats.length; i++) {
		const matAmount = itemMats[i].split('|')

		itemPrice.push(`${matAmount[0]}|${matAmount[1] * recycleAmount}`)
	}

	return itemPrice
}

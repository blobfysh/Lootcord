const max_items_per_page = 16

module.exports = {
	name: 'shop',
	aliases: ['store', 'market', 'outpost'],
	description: 'Shows all items that can be bought.',
	long: 'Visit the Outpost and see what items can be bought. The homepage sales may change so be sure to check often!',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const allItems = Object.keys(app.itemdata).filter(item => app.itemdata[item].buy.currency !== undefined)

		allItems.sort(app.itm.sortItemsHighLow.bind(app))
		allItems.sort((a, b) => {
			const aCurr = app.itemdata[a].buy.currency
			const bCurr = app.itemdata[b].buy.currency

			if (aCurr === 'scrap' && bCurr === 'money') return 1
			else if (aCurr === 'money' && bCurr === 'scrap') return -1
		})

		app.react.paginate(message, await generatePages(app, allItems, prefix, max_items_per_page))
	}
}

// returns an array of embeds
async function generatePages(app, allItems, prefix, itemsPerPage) {
	const pages = []
	const maxPage = Math.ceil(allItems.length / itemsPerPage)

	pages.push(await getHomePage(app, prefix))

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (itemsPerPage * i) - itemsPerPage
		const indexLast = (itemsPerPage * i) - 1
		const filteredItems = allItems.slice(indexFirst, indexLast)

		const pageEmbed = new app.Embed()
			.setTitle('The Outpost Shop')
			.setDescription(`Use \`${prefix}buy <item>\` to purchase.\n\nCan't find the item you want? Try searching the black market: \`${prefix}bm <item>\`.`)
			.setColor('#9449d6')

		for (const item of filteredItems) {
			const itemBuyCurr = app.itemdata[item].buy.currency

			if (itemBuyCurr !== undefined && (itemBuyCurr === 'money' || itemBuyCurr === 'scrap')) {
				pageEmbed.addField(`${app.itemdata[item].icon}\`${item}\``, `Price: ${app.common.formatNumber(app.itemdata[item].buy.amount, false, itemBuyCurr === 'scrap')}`, true)
			}
		}

		pages.push(pageEmbed)
	}

	return pages
}

async function getHomePage(app, prefix) {
	const shopRows = await app.query('SELECT * FROM shopData')
	const date = new Date()
	const converted = new Date(date.toLocaleString('en-US', {
		timeZone: 'America/New_York'
	}))
	const midnight = new Date(converted)
	midnight.setHours(24, 0, 0, 0)
	const timeUntilMidnight = midnight.getTime() - converted.getTime()

	const firstEmbed = new app.Embed()
	firstEmbed.setTitle('Welcome to the Outpost!')
	firstEmbed.setDescription(`We'll give you ${app.icons.scrap} Scrap for your ${app.icons.money} Lootcoin:\n\`${prefix}buy scrap <amount>\``)
	firstEmbed.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/733741460868038706/outpost_shop_small.png')
	firstEmbed.setColor('#9449d6')

	const items = []

	for (const shopRow of shopRows) {
		const display = app.itemdata[shopRow.item] ? `${app.itemdata[shopRow.item].icon} ${shopRow.itemDisplay}` : shopRow.itemDisplay

		if (shopRow !== null) {
			if (shopRow.itemCurrency === 'money') {
				firstEmbed.addField(display, `Price: ${app.common.formatNumber(shopRow.itemPrice)} | **${shopRow.itemAmount}** left! Use \`${prefix}buy ${shopRow.itemName}\` to purchase!`)
			}
			else if (shopRow.itemCurrency === 'scrap') {
				items.push(`**${display}** ─ ${app.common.formatNumber(shopRow.itemPrice, false, true)} (${shopRow.itemAmount} left!)\nUse \`${prefix}buy ${shopRow.itemName}\` to purchase!`)
			}
			else {
				firstEmbed.addField(display, `Price: ${shopRow.itemPrice}x ${app.itemdata[shopRow.itemCurrency].icon}\`${shopRow.itemCurrency}\` | **${shopRow.itemAmount}** left! Use \`${prefix}buy ${shopRow.itemName}\` to purchase!`)
			}
		}
	}

	firstEmbed.addField('\u200b', `__**SCRAP DEALS**__ (restocks in \`${app.cd.convertTime(timeUntilMidnight)}\`)\n${items.join('\n\n')}`)

	return firstEmbed
}

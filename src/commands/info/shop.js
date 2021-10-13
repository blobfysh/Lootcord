const max_items_per_page = 16

exports.command = {
	name: 'shop',
	aliases: ['store', 'market', 'outpost'],
	description: 'Shows all items that can be bought.',
	long: 'Visit the Outpost and see what items can be bought. The homepage sales may change so be sure to check often!',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const allItems = Object.keys(app.itemdata).filter(item => app.itemdata[item].buy.currency !== undefined)

		allItems.sort((a, b) => app.itemdata[a].buy.amount - app.itemdata[b].buy.amount)

		app.btnCollector.paginate(message, await generatePages(app, allItems, prefix, max_items_per_page, serverSideGuildId))
	}
}

// returns an array of embeds
async function generatePages (app, allItems, prefix, itemsPerPage, isServerSideEconomy) {
	const pages = []
	const maxPage = Math.ceil(allItems.length / itemsPerPage)

	pages.push(await getHomePage(app, prefix))

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (itemsPerPage * i) - itemsPerPage
		const indexLast = itemsPerPage * i
		const filteredItems = allItems.slice(indexFirst, indexLast)

		const pageEmbed = new app.Embed()
			.setTitle('The Outpost Shop')
			.setDescription(`Use \`${prefix}buy <item>\` to purchase.`)
			.setColor('#9449d6')

		for (const item of filteredItems) {
			const sale = (await app.query('SELECT * FROM sales WHERE item = ?', item))[0]
			const priceDisplay = sale ? `**SALE**: ~~${app.common.formatNumber(app.itemdata[item].buy.amount, true)}~~${app.common.formatNumber(sale.price)}` : `Price: ${app.common.formatNumber(app.itemdata[item].buy.amount)}`

			pageEmbed.addField(`${app.itemdata[item].icon}\`${item}\``, priceDisplay, true)
		}

		pages.push(pageEmbed)
	}

	return pages
}

async function getHomePage (app, prefix) {
	const saleItemRows = await app.query('SELECT * FROM sales ORDER BY price ASC')
	const date = new Date()
	const converted = new Date(date.toLocaleString('en-US', {
		timeZone: 'America/New_York'
	}))
	const restockTime = new Date(converted)
	// get time until shop restocks (shop restocks every 2 hours)
	restockTime.setHours(converted.getHours() % 2 === 0 ? converted.getHours() + 2 : converted.getHours() + 1, 0, 0, 0)
	const timeUntilRestock = restockTime.getTime() - converted.getTime()

	const firstEmbed = new app.Embed()
		.setTitle('Welcome to the Outpost!')
		.setDescription(`Use \`${prefix}buy <item>\` to purchase.`)
		.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/733741460868038706/outpost_shop_small.png')
		.setColor('#9449d6')

	firstEmbed.addField(
		`__**SCRAP DEALS**__ (restocks in \`${app.cd.convertTime(timeUntilRestock)}\`)`,
		saleItemRows.map(sale => `${app.itemdata[sale.item].icon}\`${sale.item}\`\nPrice: ${app.common.formatNumber(sale.price)}`).join('\n\n')
	)

	return firstEmbed
}

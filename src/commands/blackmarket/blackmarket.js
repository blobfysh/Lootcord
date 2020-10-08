const ITEMS_PER_PAGE = 9

module.exports = {
	name: 'blackmarket',
	aliases: ['bm'],
	description: 'Search for Black Market listings by other players.',
	long: 'Search the Black Market for item listings.\n\nThe Black Market is a shop where players can list their own items for their own price and anyone can buy them using the `buy` command. You can also search the black market here: https://lootcord.com/blackmarket',
	args: { item: 'Item to search for.' },
	examples: ['blackmarket rpg'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const item = app.parse.items(args)[0]

		if (!item) {
			const listings = await app.query('SELECT * FROM blackmarket ORDER BY RAND() LIMIT 9')

			const embed = new app.Embed()
				.setTitle('🛒 Random Black Market Listings')
				.setDescription(`These listings were made by other players!\n\nPurchase one with \`${prefix}buy <Listing ID>\` command (ex. \`t-buy Jq0cG_YY\`)\n\n**Search for items with \`bm <item to search>\`**`)
				.setColor('#9449d6')

			app.bm.displayListings(embed, listings)

			message.channel.createMessage(embed)
		}
		else {
			const listings = await app.query('SELECT * FROM blackmarket WHERE itemName = ? ORDER BY pricePer ASC LIMIT 18', [item])

			if (listings.length <= 9) {
				return message.channel.createMessage(generatePages(app, message, prefix, listings, item)[0])
			}

			app.react.paginate(message, generatePages(app, message, prefix, listings, item), 30000)
		}
	}
}

function generatePages(app, message, prefix, listings, item) {
	const maxPage = Math.ceil(listings.length / ITEMS_PER_PAGE) || 1
	const pages = []

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE
		const indexLast = (ITEMS_PER_PAGE * i) - 1
		const selectedListings = listings.slice(indexFirst, indexLast)

		const pageEmbed = new app.Embed()
			.setTitle(`Black Market Listings for: ${app.itemdata[item].icon}${item}`)
			.setDescription(`These listings were made by other players!\n\nPurchase one with \`${prefix}buy <Listing ID>\` command (ex. \`t-buy Jq0cG_YY\`)\n\n**Sorted lowest price to highest:**`)
			.setColor('#9449d6')

		app.bm.displayListings(pageEmbed, selectedListings)

		pages.push(pageEmbed)
	}

	return pages
}

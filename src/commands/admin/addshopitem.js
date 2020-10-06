module.exports = {
	name: 'addshopitem',
	aliases: ['addgamecode'],
	description: 'Add a game key or shop item to the database.',
	long: 'Add a game key or shop item to the database. This item will be displayed for sale in the `shop`.',
	args: {
		name: 'Name of game, (will be used to purchase ex. `buy game_name`).',
		amount: 'Amount of copies of game to sell.',
		price: 'Price of game.',
		currency: 'Currency used to purchase game, can be `money` or a valid item.',
		display: 'The title of the game to display in the shop, can contain spaces.',
		item: '**OPTIONAL** - The item user will receive when they purchase.'
	},
	examples: ['addshopitem fortnite 1 100 scrap Fortnite (POGGERS)'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const itemName = args[0]
		const itemAmount = args[1]
		const itemPrice = args[2]
		const itemCurrency = args[3]
		const itemDisplay = args.slice(4).join(' ')

		if (itemDisplay === undefined || itemName === undefined || itemAmount === undefined || itemPrice === undefined || itemCurrency === undefined) {
			return message.reply('ERROR ADDING ITEM:\n`addshopitem <game_sql_name> <Amount to sell> <game price> <currency to purchase with> <game name to display>`')
		}

		await app.query('INSERT INTO shopData (itemName, itemAmount, itemPrice, itemCurrency, itemDisplay, item) VALUES (?, ?, ?, ?, ?, ?)', [itemName, parseInt(itemAmount), parseInt(itemPrice), itemCurrency, itemDisplay, app.parse.items(args)[0] || ''])

		message.reply(`Successfully added \`${itemName}\` to the shop database.`)
	}
}

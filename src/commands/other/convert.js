// const CONVERT_LIMIT = 100000

exports.command = {
	name: 'convert',
	aliases: [],
	description: 'Convert Lootcord Lootcoin to another bot\'s currency using Discoin.',
	long: 'Lvl Required: 3+\nConvert your Lootcord Lootcoin to another bot\'s currency using [Discoin](https://discoin.gitbook.io/docs/users-guide). You can find participating bots and their currency codes [here](https://dash.discoin.zws.im/#/currencies).',
	args: { amount: 'Amount of Lootcoin to convert.', currency: '3-Letter currency code of currency you want to convert to.' },
	examples: ['convert 1000 DTS'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,
	levelReq: 3,
	globalEconomyOnly: true,

	async execute(app, message, { args, prefix, guildInfo }) {
		const row = await app.player.getRow(message.author.id)

		const convertAmnt = app.parse.numbers(args)[0]
		let currency = args[1] || ''
		currency = currency.toUpperCase()

		if (!convertAmnt) {
			return message.reply('❌ Please specify an amount to convert.')
		}
		else if (await app.cd.getCD(message.author.id, 'tradeban')) {
			return message.reply('❌ Trade banned users are not allowed to convert.')
		}
		else if (convertAmnt < 100) {
			return message.reply(`❌ Please enter an amount of at least ${app.common.formatNumber(100)}`)
		}
		else if (row.money < convertAmnt) {
			return message.reply(`❌ You don't have enough money for that conversion! You currently have **${app.common.formatNumber(row.money)}**`)
		}
		/*
        else if(row.discoinLimit + convertAmnt > CONVERT_LIMIT){
            return message.reply(`❌ You are limited to converting ${app.common.formatNumber(CONVERT_LIMIT)} a day.${CONVERT_LIMIT - row.discoinLimit > 0 ? ' You can still convert ' + app.common.formatNumber(CONVERT_LIMIT - row.discoinLimit) + ' today.' : ''}\n\nThis limit helps prevent players from inflating other bot currencies.`);
        }
        */

		try {
			const currencies = await app.discoin.getCurrencies()

			if (!currencies.includes(currency)) {
				return message.reply('That isn\'t a currency available on Discoin. Check out the currencies here: https://dash.discoin.zws.im/#/currencies')
			}
			else if (currency === 'LCN') {
				return message.reply('You\'re trying to convert LCN to LCN? Pick a different currency to convert to.')
			}

			// valid currency and user has money
			const response = await app.discoin.request(message.author.id, convertAmnt, currency)
			await app.player.removeMoney(message.author.id, convertAmnt)
			// await app.query("UPDATE scores SET discoinLimit = discoinLimit + ? WHERE userId = ?", [convertAmnt, message.author.id]);

			const embed = new app.Embed()
				.setTitle('Successfully Converted!')
				.setDescription(`${response.data.from.name} to ${response.data.to.name}`)
				.addField('📥 LCN', app.common.formatNumber(convertAmnt), true)
				.addField(`📤 ${currency}`, response.data.payout.toFixed(2), true)
				.setFooter(`Transaction ID: ${response.data.id}`)
				.setColor(13451564)

			message.channel.createMessage(embed)


			const logEmbed = new app.Embed()
				.setAuthor('Discoin Conversion')
				.setTitle(`${message.author.username} : ${message.author.id}`)
				.setColor(13451564)
				.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png')
				.setDescription(`${response.data.from.name} to ${response.data.to.name}`)
				.addField('📥 LCN in:', convertAmnt, true)
				.addField(`📤 ${currency} out:`, response.data.payout.toFixed(2), true)
				.setFooter(`Transaction ID: ${response.data.id}`)

			app.messager.messageLogs(logEmbed)
		}
		catch (err) {
			return message.reply('Discoin API error, try again later or contact the moderators.')
		}
	}
}

const POSSIBLE_ITEMS = ['egg_basket', 'bronze_egg', 'silver_egg']
const SUCCESS_QUOTES = ['🐰 {user} found {reward}']

module.exports = {
	name: 'egg_hunt',
	cooldown: 3600 * 1000,

	async execute(app, message, { prefix }) {
		console.log('[EVENT] Easter event started')

		const collectorObj = app.msgCollector.createChannelCollector(message, m => m.channel.id === message.channel.id &&
            m.content.toLowerCase() === 'hunt', { time: 40000 })

		const exploreEmbed = new app.Embed()
			.setColor('#e6b8e9')
			.setTitle('Event - __EGG HUNT__')
			.setDescription('**The easter bunny hid some eggs!**\n\nType `hunt` to look for some eggs!')
			.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/828167072332382228/egg_1f95a.png')

		try {
			const startedMessage = await message.channel.createMessage(exploreEmbed)
			const joined = {}

			collectorObj.collector.on('collect', async m => {
				if (!await app.player.isActive(m.author.id, m.channel.guild.id)) return m.channel.createMessage(`Your account is not active in this server! Use \`${prefix}play\` to activate it here`)

				// ignore users who have already joined this event
				else if (Object.keys(joined).includes(m.author.id)) return

				// max 10 people per event
				else if (Object.keys(joined).length >= 10) return

				joined[m.author.id] = m.author
				m.addReaction(app.icons.confirm)
			})

			collectorObj.collector.on('end', async reason => {
				exploreEmbed.setDescription(`**The easter bunny hid some eggs!**\n\nType \`hunt\` to look for some eggs!\n❌ This event has ended and is no longer accepting responses! ${app.icons.blackjack_dealer_lost}`)
				startedMessage.edit(exploreEmbed)

				const results = []

				for (const user in joined) {
					if (Math.random() < 0.9) {
						const userRow = await app.player.getRow(user)
						const userItems = await app.itm.getItemObject(user)

						const itemCt = await app.itm.getItemCount(userItems, userRow)
						const hasEnough = await app.itm.hasSpace(itemCt, 1)
						const quote = SUCCESS_QUOTES[Math.floor(Math.random() * SUCCESS_QUOTES.length)]

						if (hasEnough) {
							const item = POSSIBLE_ITEMS[Math.floor(Math.random() * POSSIBLE_ITEMS.length)]

							await app.itm.addItem(user, item, 1)

							results.push(quote.replace('{user}', `<@${user}>`).replace('{reward}', `**1x** ${app.itemdata[item].icon}\`${item}\``))
						}
						else {
							const moneyMin = 1500
							const moneyMax = 3000
							const winnings = Math.floor((Math.random() * (moneyMax - moneyMin + 1)) + moneyMin)

							await app.player.addMoney(user, winnings)

							results.push(quote.replace('{user}', `<@${user}>`).replace('{reward}', app.common.formatNumber(winnings)))
						}
					}
					else {
						results.push(`<@${user}> couldn't find any eggs... 😞`)
					}
				}

				if (results.length) {
					const resultsEmb = new app.Embed()
						.setColor('#e6b8e9')
						.setTitle('Event Results - __EGG HUNT__')
						.setDescription(results.join('\n'))

					await message.channel.createMessage(resultsEmb)
				}
			})
		}
		catch (err) {
			// kicked bot during event?
			console.warn(err)
		}
	}
}

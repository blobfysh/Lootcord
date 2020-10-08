module.exports = {
	name: 'trickortreatrare',
	cooldown: 3600 * 1000,

	async execute(app, message, { prefix }) {
		console.log('[EVENT] Halloween event started')

		const collectorObj = app.msgCollector.createChannelCollector(message, m => m.channel.id === message.channel.id &&
            m.content.toLowerCase() === 'steal bag', { time: 40000 })

		const exploreEmbed = new app.Embed()
			.setColor('#881EE4')
			.setTitle('Event - __CANDY THEFT__')
			.setDescription(`**Someone dropped their ${app.itemdata.medium_loot_bag.icon}\`medium_loot_bag\`!**\n\nQuick, type \`steal bag\` to grab it!`)
			.setImage(app.itemdata.medium_loot_bag.image)

		try {
			const startedMessage = await message.channel.createMessage(exploreEmbed)
			const joined = {}

			collectorObj.collector.on('collect', async m => {
				if (!await app.player.isActive(m.author.id, m.channel.guild.id)) return m.channel.createMessage(`Your account is not active in this server! Use \`${prefix}play\` to activate it here`)

				// ignore users who have already joined this event
				else if (Object.keys(joined).includes(m.author.id)) return

				// max 20 people per event
				else if (Object.keys(joined).length >= 20) return

				joined[m.author.id] = m.author
				m.addReaction(app.icons.confirm)
			})

			collectorObj.collector.on('end', async reason => {
				exploreEmbed.setDescription(`~~**Someone dropped their ${app.itemdata.medium_loot_bag.icon}\`medium_loot_bag\`!**\n\nQuick, type \`steal bag\` to grab it!~~\n❌ This event has ended and is no longer accepting responses! ${app.icons.blackjack_dealer_lost}`)
				startedMessage.edit(exploreEmbed)

				const participants = Object.keys(joined)

				if (participants.length) {
					const winner = participants[Math.floor(Math.random() * participants.length)]

					await app.itm.addItem(winner, 'medium_loot_bag', 1)

					const resultsEmb = new app.Embed()
						.setColor('#881EE4')
						.setTitle('Event Results - __CANDY THEFT__')
						.setDescription(`<@${winner}> stole the ${app.itemdata.medium_loot_bag.icon}\`medium_loot_bag\`!`)

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

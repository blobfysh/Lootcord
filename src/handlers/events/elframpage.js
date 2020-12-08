module.exports = {
	name: 'elframpage',
	cooldown: 3600 * 1000,

	async execute(app, message, { prefix }) {
		console.log('[EVENT] Christmas event started')

		const collectorObj = app.msgCollector.createChannelCollector(message, m => m.channel.id === message.channel.id &&
            m.content.toLowerCase() === 'slap elf', { time: 40000 })

		const exploreEmbed = new app.Embed()
			.setColor('#006008')
			.setTitle('Event - __ELF RAMPAGE__')
			.setDescription('**An angry 🧝‍♂️ elf has escaped from Santa\'s workshop!**\n\nQuick, type `slap elf` to help Santa stop him from ruining christmas!')

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
				exploreEmbed.setDescription(`~~**An angry elf has escaped from Santa's workshop!**\n\nQuick, type \`slap elf\` to help Santa stop him from ruining christmas!~~\n❌ This event has ended and is no longer accepting responses! ${app.icons.blackjack_dealer_lost}`)
				startedMessage.edit(exploreEmbed)

				const participants = Object.keys(joined)

				if (participants.length) {
					const winner = participants[Math.floor(Math.random() * participants.length)]

					await app.itm.addItem(winner, 'medium_present', 1)

					const resultsEmb = new app.Embed()
						.setColor('#FF2B2B')
						.setTitle('Event Results - __ELF RAMPAGE__')
						.setDescription(`<@${winner}> received a ${app.itemdata.medium_present.icon}\`medium_present\` for slapping the elf and saving christmas!`)

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

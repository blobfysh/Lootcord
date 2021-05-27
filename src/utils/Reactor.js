const ReactionHandler = require('eris-reactions')

class Reactor {
	constructor(icons) {
		this.icons = icons
	}

	/**
     * Creates a message with pages and reactions to control the page
     * @param {*} message Discord message
     * @param {Array<DiscordEmbed>} embeds Array of embeds, each considered a page
     * @param {number} time Time in milliseconds bot listens for reactions
     */
	async paginate(message, embeds, time = 60000) {
		if (embeds.length === 1) {
			return message.channel.createMessage(embeds[0])
		}

		let page = 0
		embeds[0].setFooter(`Page 1/${embeds.length}`)
		const botMessage = await message.channel.createMessage(embeds[0])
		await botMessage.addReaction('◀️')
		await botMessage.addReaction('▶️')
		await botMessage.addReaction(this.icons.cancel)

		const reactionListener = new ReactionHandler.continuousReactionStream(botMessage, reactorId => reactorId === message.author.id, false, {
			time
		})

		reactionListener.on('reacted', async reaction => {
			try {
				if (reaction.emoji.name === '◀️') {
					if (page !== 0) {
						page--
						embeds[page].setFooter(`Page ${page + 1}/${embeds.length}`)
						await botMessage.edit(embeds[page])
					}
					await botMessage.removeReaction('◀️', message.author.id)
				}
				else if (reaction.emoji.name === '▶️') {
					if (page !== (embeds.length - 1)) {
						page++
						embeds[page].setFooter(`Page ${page + 1}/${embeds.length}`)
						await botMessage.edit(embeds[page])
					}
					await botMessage.removeReaction('▶️', message.author.id)
				}
				else if (reaction.emoji.name === this.icons.cancel) {
					reactionListener.stopListening('Canceled')
					botMessage.delete()
				}
			}
			catch (err) {
				// continue
			}
		})
	}
}

module.exports = Reactor

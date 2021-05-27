const EventEmitter = require('events').EventEmitter
const Interaction = require('../structures/Interaction')

class ButtonCollector {
	constructor(app) {
		this.app = app
		this.collectors = []

		this.app.bot.on('rawWS', this.verify.bind(this))
	}

	async verify(packet) {
		if (packet.t !== 'INTERACTION_CREATE') {
			return
		}

		const interaction = new Interaction(packet.d, this.app.bot.user.id)

		if (interaction.type !== 3) {
			return
		}

		const colObj = this.collectors.find(obj => obj.messageId === interaction.message.id)

		if (colObj) {
			if (!colObj.filter(interaction)) {
				return interaction.defer()
			}

			colObj.collected.push(interaction)
			colObj.collector.emit('collect', interaction)

			if (colObj.maxMatches && colObj.collected.length >= colObj.maxMatches) {
				this.stopCollector(colObj, colObj.collected)
			}
		}
	}

	/**
     * Collects button clicks from a message
     * @param {string} messageId Message ID of message with buttons
     * @param {Function} filter custom filter against the interaction
	 * @param {object} options Options for collector
	 * @param {number | undefined} options.time time in milliseconds collector should last
	 * @param {number | undefined} options.maxMatches max matches before stopping collector
     */
	createCollector(messageId, filter, options = { time: 60000, maxMatches: undefined }) {
		const eventCollector = new EventEmitter()

		const collectorObj = {
			messageId,
			timeout: options.time && setTimeout(() => {
				eventCollector.emit('end', 'time')
				this.collectors.splice(this.collectors.indexOf(collectorObj), 1)
			}, options.time),
			collector: eventCollector,
			collected: [],
			maxMatches: options.maxMatches,
			filter
		}

		this.collectors.push(collectorObj)

		return {
			collector: collectorObj.collector,
			stopCollector: () => { this.stopCollector(collectorObj) }
		}
	}

	awaitClicks(messageId, filter, options = { time: 15000, maxMatches: 1 }) {
		options.maxMatches = options.maxMatches || 1

		const { collector } = this.createCollector(messageId, filter, options)

		return new Promise((resolve, reject) => {
			collector.once('end', val => {
				if (val !== 'time') {
					resolve(val)
				}
				else {
					reject(val)
				}
			})
		})
	}

	async paginate(message, embeds, time = 60000) {
		if (embeds.length === 1) {
			return message.channel.createMessage(embeds[0])
		}

		let page = 0

		embeds[0].setFooter(`Page 1/${embeds.length}`)

		const previousButton = {
			type: 2,
			label: '⯇',
			custom_id: 'previous',
			style: 2
		}
		const nextButton = {
			type: 2,
			label: '⯈',
			custom_id: 'next',
			style: 2
		}
		const closeButton = {
			type: 2,
			label: '✖',
			custom_id: 'closed',
			style: 4
		}

		const botMessage = await message.channel.createMessage({
			embed: embeds[0].embed,
			components: [{
				type: 1,
				components: [
					nextButton,
					closeButton
				]
			}]
		})

		const { collector, stopCollector } = this.createCollector(botMessage.id, i => i.user.id === message.author.id, { time })

		collector.on('collect', async i => {
			try {
				const components = []

				if (i.customID === 'previous' && page !== 0) {
					page--
					embeds[page].setFooter(`Page ${page + 1}/${embeds.length}`)

					if (page !== 0) {
						components.push(previousButton)
					}

					components.push(nextButton, closeButton)

					await i.respond({
						embeds: [embeds[page].embed],
						components: [{
							type: 1,
							components
						}]
					})
				}
				else if (i.customID === 'next' && page !== (embeds.length - 1)) {
					page++
					embeds[page].setFooter(`Page ${page + 1}/${embeds.length}`)

					components.push(previousButton)

					if (page !== (embeds.length - 1)) {
						components.push(nextButton)
					}

					components.push(closeButton)

					await i.respond({
						embeds: [embeds[page].embed],
						components: [{
							type: 1,
							components
						}]
					})
				}
				else if (i.customID === 'closed') {
					await i.defer()

					stopCollector()
					await botMessage.delete()
				}
			}
			catch (err) {
				// continue
			}
		})

		collector.on('end', msg => {
			if (msg === 'time') {
				embeds[page].setFooter(`Page ${page + 1} | Page buttons timed out`)

				botMessage.edit({
					embed: embeds[page].embed,
					components: []
				})
			}
		})
	}

	/**
     * Clears timeout for collector and stops it
     * @param {*} collectorObj Collector to remove
     */
	stopCollector(collectorObj, message = 'forced') {
		if (this.collectors.includes(collectorObj)) {
			clearTimeout(collectorObj.timeout)
			collectorObj.collector.emit('end', message)
			this.collectors.splice(this.collectors.indexOf(collectorObj), 1)
		}
	}
}

module.exports = ButtonCollector

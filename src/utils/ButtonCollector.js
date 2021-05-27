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
				return interaction.respond({
					type: 6
				})
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

		return collectorObj.collector
	}

	awaitClicks(messageId, filter, options = { time: 15000, maxMatches: 1 }) {
		options.maxMatches = options.maxMatches || 1

		const collector = this.createCollector(messageId, filter, options)

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

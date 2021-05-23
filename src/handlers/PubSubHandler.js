const redis = require('ioredis')

class PubSubHandler {
	constructor(app) {
		this.app = app

		this.start()
	}

	async start() {
		this.subscriber = new redis({
			host: this.app.config.redis.host,
			password: this.app.config.redis.password
		})
		this.publisher = new redis({
			host: this.app.config.redis.host,
			password: this.app.config.redis.password
		})

		this.subscriber.on('message', this.handleMessage.bind(this))

		await this.subscriber.subscribe(['messageUser'])
	}

	async handleMessage(channel, message) {
		message = JSON.parse(message)

		// make sure message is meant for this shard (cluster really but there can be multiple clusters with same ID)
		if (!isNaN(message.shard) && this.app.bot.shards.has(message.shard)) {
			if (channel === 'messageUser') {
				await this.app.common.messageUser(message.id, message.content)
			}
		}
	}

	/*
	async messageUser(id, message) {
		await this.publisher.publish('messageUser', JSON.stringify({
			shard: 0,
			id,
			content: message
		}))
	}
	*/
}

module.exports = PubSubHandler

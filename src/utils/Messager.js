class Messager {
	constructor(app) {
		this.app = app
		this.config = app.config
		this.modChannel = app.config.modChannel
		this.modRoleID = app.config.modRoleID
	}

	/**
     *
     * @param {{content: string, embed: DiscordEmbed}} message Message object to send
     * @param {{ping: boolean}} options Ping will ping the moderators to notify of message
     */
	async messageMods(message, options = { ping: false }) {
		try {
			if (options.ping) {
				message.content = `<@&${this.modRoleID}>, ${message.content ? message.content : ''}`
				await this.app.bot.createMessage(this.modChannel, message)
			}
			else {
				await this.app.bot.createMessage(this.modChannel, message)
			}
		}
		catch (err) {
			console.warn('[MESSAGER] Failed to message moderators')
		}
	}

	/**
     *
     * @param {{content: string, embed: DiscordEmbed}|DiscordEmbed} message
     */
	messageLogs(message) {
		try {
			if (!this.config.webhooks.logs || !this.config.webhooks.logs.id.length) return

			// in future can queue up logs to send multiple embeds at once
			if (Array.isArray(message)) {
				this.app.bot.executeWebhook(this.config.webhooks.logs.id, this.config.webhooks.logs.token, {
					embeds: message.map(embed => embed.embed)
				})
			}
			else if (message instanceof this.app.Embed) {
				this.app.bot.executeWebhook(this.config.webhooks.logs.id, this.config.webhooks.logs.token, {
					embeds: [message].map(embed => embed.embed)
				})
			}
			else {
				this.app.bot.executeWebhook(this.config.webhooks.logs.id, this.config.webhooks.logs.token, {
					content: message
				})
			}
		}
		catch (err) {
			console.log(err)
		}
	}
}

module.exports = Messager

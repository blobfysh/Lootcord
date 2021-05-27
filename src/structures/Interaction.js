/* eslint-disable no-unused-vars */
const axios = require('axios')
const { WebhookPayload } = require('eris')
const { InteractionResponse } = require('slash-commands')

class Interaction {
	constructor(i, clientId) {
		this.id = i.id
		this.type = i.type
		this.data = i.data
		this.guildID = i.guild_id
		this.channelID = i.channel_id
		this.user = i.member ? i.member.user : i.user
		this.member = i.member || undefined
		this.token = i.token
		this.version = i.version
		this.message = i.message
		this.clientId = clientId
	}

	/**
	 * Respond to an interaction. Can only be used once, further responses should use the followUp method
	 * @param {InteractionResponse} response
	 */
	async respond(response) {
		await axios({
			url: `https://discord.com/api/v8/interactions/${this.id}/${this.token}/callback`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			data: response
		})
	}

	/**
	 *
	 * @param {WebhookPayload} options
	 */
	async editResponse(options) {
		await axios({
			url: `https://discord.com/api/v8/webhooks/${this.clientId}/${this.token}/messages/@original${options.wait ? '?wait=true' : ''}`,
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				content: options.content,
				embeds: options.embeds,
				tts: options.tts
			}
		})
	}

	/**
	 *
	 * @param {WebhookPayload} options
	 */
	async followUp(options) {
		await axios({
			url: `https://discord.com/api/v8/webhooks/${this.clientId}/${this.token}${options.wait ? '?wait=true' : ''}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				content: options.content,
				embeds: options.embeds,
				tts: options.tts
			}
		})
	}
}

module.exports = Interaction

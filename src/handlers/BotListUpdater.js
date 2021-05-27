const CronJob = require('cron').CronJob
const axios = require('axios')

class BotListUpdater {
	constructor (cache, config) {
		this.cache = cache
		this.config = config
		this.hourly = new CronJob('0 * * * *', this.postStats.bind(this), null, false, 'America/New_York')
	}

	start () {
		this.hourly.start()
	}

	async postStats () {
		const stats = JSON.parse(await this.cache.get('stats')) || {}

		if (this.config.debug || !stats.guilds || !stats.users) return

		let completedLists = 0

		for (const botList of this.config.botLists) {
			try {
				if (botList.url.includes('top.gg') || botList.url.includes('botsfordiscord.com')) {
					await axios({
						method: 'POST',
						headers: {
							'Authorization': botList.token,
							'Content-Type': 'application/json'
						},
						data: {
							server_count: stats.guilds
						},
						url: botList.url
					})
				}
				else if (botList.url.includes('discord.bots.gg')) {
					await axios({
						method: 'POST',
						headers: {
							'Authorization': botList.token,
							'Content-Type': 'application/json'
						},
						data: {
							guildCount: stats.guilds
						},
						url: botList.url
					})
				}
				else if (botList.url.includes('discordbotlist.com')) {
					await axios({
						method: 'POST',
						headers: {
							'Authorization': botList.token,
							'Content-Type': 'application/json'
						},
						data: {
							guilds: stats.guilds
						},
						url: botList.url
					})
				}

				completedLists++
			}
			catch (err) {
				console.warn(`Failed posting stats to ${botList.url}`)
			}
		}

		console.log(`Posted stats to ${completedLists} bot lists.`)
	}
}

module.exports = BotListUpdater

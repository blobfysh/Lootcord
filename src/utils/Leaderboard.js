class Leaderboard {
	constructor(app) {
		this.app = app
	}

	async getLB() {
		const moneyRows = (await this.app.query('SELECT userId, money, badge FROM scores ORDER BY money DESC LIMIT 5')).filter(user => user.userId !== 0)
		const levelRows = (await this.app.query('SELECT userId, level, badge FROM scores ORDER BY level DESC LIMIT 5')).filter(user => user.userId !== 0)
		const killRows = (await this.app.query('SELECT userId, kills, badge FROM scores ORDER BY kills DESC LIMIT 5')).filter(user => user.userId !== 0)
		const clanRows = await this.app.query('SELECT name, money FROM clans ORDER BY money DESC LIMIT 5')

		const leaders = []
		const levelLeaders = []
		const killLeaders = []
		// const tokenLeaders = []
		const clanLeaders = []

		const leaderJSON = {
			money: {},
			level: {},
			kills: {},
			clans: {},
			tokens: {}
		}

		for (let i = 0; i < moneyRows.length; i++) {
			try {
				const user = await this.app.common.fetchUser(moneyRows[i].userId, { cacheIPC: false })
				leaders.push(`${this.app.player.getBadge(moneyRows[i].badge)} ${user.username}#${user.discriminator} - ${this.app.common.formatNumber(moneyRows[i].money)}`)

				leaderJSON.money[user.username] = {
					data: this.app.common.formatNumber(moneyRows[i].money, true),
					avatar: this.app.common.getAvatar(user)
				}
			}
			catch (err) {
				// continue
			}
		}

		for (let i = 0; i < levelRows.length; i++) {
			try {
				const user = await this.app.common.fetchUser(levelRows[i].userId, { cacheIPC: false })
				levelLeaders.push(`${this.app.player.getBadge(levelRows[i].badge)} ${user.username}#${user.discriminator} - Level ${levelRows[i].level}`)

				leaderJSON.level[user.username] = {
					data: levelRows[i].level,
					avatar: this.app.common.getAvatar(user)
				}
			}
			catch (err) {
				// continue
			}
		}

		for (let i = 0; i < killRows.length; i++) {
			try {
				const user = await this.app.common.fetchUser(killRows[i].userId, { cacheIPC: false })
				killLeaders.push(`${this.app.player.getBadge(killRows[i].badge)} ${user.username}#${user.discriminator} - ${killRows[i].kills} kills`)

				leaderJSON.kills[user.username] = {
					data: killRows[i].kills,
					avatar: this.app.common.getAvatar(user)
				}
			}
			catch (err) {
				// continue
			}
		}

		for (let i = 0; i < clanRows.length; i++) {
			try {
				clanLeaders.push(`\`${clanRows[i].name}\` - ${this.app.common.formatNumber(clanRows[i].money)}`)

				leaderJSON.clans[clanRows[i].name] = {
					data: this.app.common.formatNumber(clanRows[i].money, true),
					avatar: 'https://cdn.discordapp.com/attachments/542248243313246208/603306945373405222/clan-icon.png'
				}
			}
			catch (err) {
				// continue
			}
		}

		await this.app.itm.addBadge(moneyRows[0].userId, 'elitist')
		await this.app.itm.addBadge(killRows[0].userId, 'elitist')
		if (new Date().getDate() > 5) await this.app.itm.addBadge(levelRows[0].userId, 'elitist')
		clanLeaders[0] = clanLeaders.length ? clanLeaders[0] : 'No clans'

		return {
			moneyLB: leaders,
			levelLB: levelLeaders,
			killLB: killLeaders,
			clanLB: clanLeaders,
			leadersOBJ: leaderJSON
		}
	}
}

module.exports = Leaderboard

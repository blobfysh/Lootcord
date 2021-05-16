const { CLANS } = require('../resources/constants')

class Clans {
	constructor(app) {
		this.app = app
	}

	/**
     *
     * @param {string} id ID of clan to get information for
     */
	async getRow(id) {
		return (await this.app.query('SELECT * FROM clans WHERE clanId = ?', [id]))[0]
	}

	/**
     * Retrieves row for a clan and prevents queries from updating the clan.
	 * @param {*} query
     * @param {string} id ID of clan to get information for
     */
	async getRowForUpdate(query, id) {
		return (await query('SELECT * FROM clans WHERE clanId = ? FOR UPDATE', [id]))[0]
	}

	async searchClanRow(search) {
		if (!search.match(/^[a-zA-Z0-9 ]+$/)) return undefined

		return (await this.app.query('SELECT * FROM clans WHERE LOWER(name) = ?', [search.match(/^[a-zA-Z0-9 ]+$/)[0].toLowerCase()]))[0]
	}

	async getMembers(clanId) {
		const users = await this.app.query(`SELECT * FROM scores WHERE clanId = ${clanId} ORDER BY clanRank DESC`)

		const memberIds = []

		for (let i = 0; i < users.length; i++) {
			memberIds.push(users[i].userId)
		}

		return {
			count: users.length,
			memberIds
		}
	}

	async disbandClan(clanId) {
		this.app.query(`UPDATE scores SET clanRank = 0 WHERE clanId = ${clanId}`)
		this.app.query(`UPDATE scores SET clanId = 0 WHERE clanId = ${clanId}`)

		this.app.query(`DELETE FROM user_items WHERE userId = ${clanId}`)
		this.app.query(`DELETE FROM clans WHERE clanId = ${clanId}`)
	}

	getUpkeep(level, bank, memberCount, inactiveMembers) {
		let upkeep = 0

		upkeep += CLANS.levels[level].upkeep

		if (inactiveMembers > Math.floor(memberCount / 2)) return upkeep + Math.floor(bank / 2)

		return upkeep
	}

	async getClanData(clanRow, clanItems) {
		let kills = 0
		let deaths = 0
		let timePlayed = 0
		let inactiveMembers = 0
		const dateTime = Date.now()

		const { itemCount, invValue } = await this.app.itm.getUserItems(clanItems)
		const memberRows = await this.app.query(`SELECT * FROM scores WHERE clanId = ${clanRow.clanId}`)

		for (let i = 0; i < memberRows.length; i++) {
			kills += memberRows[i].kills
			deaths += memberRows[i].deaths
			timePlayed += dateTime - memberRows[i].createdAt

			// check if member hasn't played in 14+ days
			if (memberRows[i].lastActive < (Date.now() - (1000 * 60 * 60 * 24 * 14))) {
				inactiveMembers++
			}
		}

		return {
			memberCount: memberRows.length,
			inactiveMemberCount: inactiveMembers,
			kills,
			deaths,
			playtime: timePlayed,
			itemCount,
			vaultSlots: CLANS.levels[clanRow.level].itemLimit,
			vaultValue: invValue
		}
	}

	async hasSpace(clanData, amount) {
		return clanData.vaultSlots - clanData.itemCount >= amount
	}

	async raidNotify(victimClanId, raiderClanName, moneyStolen, itemsStolenString) {
		const users = await this.app.query(`SELECT * FROM scores WHERE clanId = ${victimClanId}`)

		for (let i = 0; i < users.length; i++) {
			if (users[i].notify3) {
				const raidedEmb = new this.app.Embed()
					.setTitle(`Your clan was raided by \`${raiderClanName}\`!`)
					.addField('Scrap Lost', this.app.common.formatNumber(moneyStolen), true)
					.addField('Items Lost', itemsStolenString)
					.setColor(16734296)

				await this.app.common.messageUser(users[i].userId, raidedEmb)
			}
		}
	}

	async removeMoney(clanId, amount) {
		await this.app.query(`UPDATE clans SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async removeMoneySafely(query, clanId, amount) {
		await query(`UPDATE clans SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addMoney(clanId, amount) {
		await this.app.query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addMoneySafely(query, clanId, amount) {
		await query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addLog(clanId, details) {
		try {
			await this.app.query('INSERT INTO clan_logs (clanId, details, logTime, logDate) VALUES (?, ?, ?, NOW())', [clanId, details, new Date().getTime()])
		}
		catch (err) {
			// continue
		}
	}
}

module.exports = Clans

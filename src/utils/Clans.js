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

	getUpkeep(bank, memberCount, inactiveMembers) {
		const base = memberCount * 5000

		if (inactiveMembers > Math.floor(memberCount / 2)) return base + Math.floor(bank / 2)

		return base
	}

	getBankLimit(memberCount) {
		return memberCount * 1000000
	}

	async getClanData(clanRow) {
		let currPower = 0
		let maxPower = 0
		let kills = 0
		let deaths = 0
		let timePlayed = 0
		let inactiveMembers = 0
		const dateTime = Date.now()

		const clanItems = await this.app.itm.getUserItems(await this.app.itm.getItemObject(clanRow.clanId))
		const memberRows = await this.app.query(`SELECT * FROM scores WHERE clanId = ${clanRow.clanId}`)

		for (let i = 0; i < memberRows.length; i++) {
			kills += memberRows[i].kills
			deaths += memberRows[i].deaths
			timePlayed += dateTime - memberRows[i].createdAt

			if (memberRows[i].clanRank >= 1) {
				currPower += memberRows[i].power
				maxPower += memberRows[i].max_power
			}

			// check if member hasn't played in 14+ days
			if (memberRows[i].lastActive < (Date.now() - (1000 * 60 * 60 * 24 * 14))) {
				inactiveMembers++
			}
		}

		currPower -= clanRow.reduction

		return {
			usedPower: clanItems.itemCount,
			currPower,
			explosion: clanRow.reduction,
			maxPower,
			memberCount: memberRows.length,
			inactiveMemberCount: inactiveMembers,
			kills,
			deaths,
			playtime: timePlayed,
			vaultValue: clanItems.invValue
		}
	}

	async hasPower(clanId, amount) {
		const clanPower = await this.getClanData(await this.getRow(clanId))

		if ((clanPower.currPower - clanPower.usedPower) >= amount) {
			return true
		}

		return false
	}

	async hasMoney(clanId, amount) {
		const clan = await this.getRow(clanId)

		if (clan.money >= amount) {
			return true
		}

		return false
	}

	async raidNotify(victimClanId, raiderClanName, moneyStolen, itemsStolen) {
		const users = await this.app.query(`SELECT * FROM scores WHERE clanId = ${victimClanId}`)

		for (let i = 0; i < users.length; i++) {
			if (users[i].notify3) {
				const raidedEmb = new this.app.Embed()
					.setTitle(`Your clan was raided by \`${raiderClanName}\`!`)
					.addField('Money Stolen:', this.app.common.formatNumber(moneyStolen), true)
					.addField('Items Stolen:', itemsStolen.join('\n'))
					.setColor(16734296)

				this.app.common.messageUser(users[i].userId, raidedEmb)
			}
		}
	}

	async removeMoney(clanId, amount) {
		await this.app.query(`UPDATE clans SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addMoney(clanId, amount) {
		await this.app.query(`UPDATE clans SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addLog(clanId, details) {
		await this.app.query('INSERT INTO clan_logs (clanId, details, logTime, logDate) VALUES (?, ?, ?, NOW())', [clanId, details, new Date().getTime()])
	}
}

module.exports = Clans

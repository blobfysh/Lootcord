const { CLANS } = require('../resources/constants')

class Clans {
	constructor (app) {
		this.app = app
	}

	/**
     *
     * @param {string} id ID of clan to get information for
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getRow (id, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			return (await this.app.query('SELECT * FROM server_clans WHERE clanId = ?', [id]))[0]
		}

		return (await this.app.query('SELECT * FROM clans WHERE clanId = ?', [id]))[0]
	}

	/**
     * Retrieves row for a clan and prevents queries from updating the clan.
	 * @param {*} query
     * @param {string} id ID of clan to get information for
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getRowForUpdate (query, id, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			return (await query('SELECT * FROM server_clans WHERE clanId = ? FOR UPDATE', [id]))[0]
		}

		return (await query('SELECT * FROM clans WHERE clanId = ? FOR UPDATE', [id]))[0]
	}

	async searchClanRow (search, serverSideGuildId = undefined) {
		if (!search.match(/^[a-zA-Z0-9 ]+$/)) {
			return undefined
		}
		else if (serverSideGuildId) {
			return (await this.app.query('SELECT * FROM server_clans WHERE LOWER(name) = ? AND guildId = ?', [search.match(/^[a-zA-Z0-9 ]+$/)[0].toLowerCase(), serverSideGuildId]))[0]
		}

		return (await this.app.query('SELECT * FROM clans WHERE LOWER(name) = ?', [search.match(/^[a-zA-Z0-9 ]+$/)[0].toLowerCase()]))[0]
	}

	async getMembers (clanId, serverSideGuildId = undefined) {
		let users

		if (serverSideGuildId) {
			users = await this.app.query('SELECT * FROM server_scores WHERE clanId = ? AND guildId = ? ORDER BY clanRank DESC', [clanId, serverSideGuildId])
		}
		else {
			users = await this.app.query('SELECT * FROM scores WHERE clanId = ? ORDER BY clanRank DESC', [clanId])
		}

		const memberIds = []

		for (let i = 0; i < users.length; i++) {
			memberIds.push(users[i].userId)
		}

		return {
			count: users.length,
			memberIds,
			rows: users
		}
	}

	async disbandClan (clanId, serverSideGuildId = undefined) {
		await this.app.query(`UPDATE ${serverSideGuildId ? 'server_scores' : 'scores'} SET clanId = 0, clanRank = 0 WHERE clanId = ?`, [clanId])

		await this.app.query(`DELETE FROM ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} WHERE id = ?`, [clanId])
		await this.app.query(`DELETE FROM ${serverSideGuildId ? 'server_clans' : 'clans'} WHERE clanId = ?`, [clanId])
	}

	getUpkeep (level, bank, memberCount, inactiveMembers) {
		let upkeep = 0

		upkeep += CLANS.levels[level].upkeep

		if (inactiveMembers > Math.floor(memberCount / 2)) return upkeep + Math.floor(bank / 2)

		return upkeep
	}

	async getClanData (clanRow, clanItems, serverSideGuildId = undefined) {
		let kills = 0
		let deaths = 0
		let timePlayed = 0
		let inactiveMembers = 0
		const dateTime = Date.now()

		const { itemCount, invValue } = await this.app.itm.getUserItems(clanItems)
		const memberRows = await this.app.query(`SELECT * FROM ${serverSideGuildId ? 'server_scores' : 'scores'} WHERE clanId = ${clanRow.clanId}`)

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

	async hasSpace (clanData, amount) {
		return clanData.vaultSlots - clanData.itemCount >= amount
	}

	/**
     *
	 * @param {*} query The transaction query to use
     * @param {string} id ID of clan to add item to.
     * @param {string|Array<string>} item   Item to add, can be array ex.(["crate|2","semi_rifle|1"])
     * @param {string|number|null} amount Amount of item to add, must be number.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addItemSafely (query, id, item, amount, serverSideGuildId = undefined) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return 'item must be an array of items. ex. ["rock|1"]'
			}

			for (let i = 0; i < item.length; i++) {
				// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
				const itemToCheck = item[i].split('|')

				// Store id and item in array to bulk insert x times # of items.
				const insertValues = Array(parseInt(itemToCheck[1])).fill([id, itemToCheck[0]])

				await query(`INSERT INTO ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} (id, item) VALUES ?`, [insertValues])
			}
		}
		else {
			const insertValues = Array(parseInt(amount)).fill([id, item])
			return query(`INSERT INTO ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} (id, item) VALUES ?`, [insertValues])
		}
	}

	/**
     *
	 * @param {*} query The transaction query to use
     * @param {string} id ID of clan to remove item from.
     * @param {string|Array<string>} item Item to remove, can be an array ex.(["crate|2","semi_rifle|3"])
     * @param {string|number|null} amount Amount of item to remove.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeItemSafely (query, id, item, amount, serverSideGuildId = undefined) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return 'item must be an array of items. ex. ["rock|1"]'
			}

			for (let i = 0; i < item.length; i++) {
				// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
				const itemToCheck = item[i].split('|')

				await query(`DELETE FROM ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} WHERE id = ${id} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`)
			}
		}
		else {
			await query(`DELETE FROM ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} WHERE id = ${id} AND item = '${item}' LIMIT ${parseInt(amount)}`)
		}
	}

	/**
     * Retrieves items for a clan.
     * @param {string} id Clan id to retrieve items for (in an object format).
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getItemObject (id, serverSideGuildId = undefined) {
		const itemObj = {}
		const itemRows = await this.app.query(`SELECT item, COUNT(item) AS amount FROM ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} WHERE id = "${id}" GROUP BY item`)

		for (let i = 0; i < itemRows.length; i++) {
			if (this.app.itemdata[itemRows[i].item]) itemObj[itemRows[i].item] = itemRows[i].amount
		}

		return itemObj
	}

	/**
     * Retrieves items for a clan and prevents queries from updating the items.
	 * @param {*} query
     * @param {string} id Clan id to retrieve items for (in an object format).
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getItemObjectForUpdate (query, id, serverSideGuildId = undefined) {
		const itemObj = {}
		const itemRows = await query(`SELECT item, COUNT(item) AS amount FROM ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} WHERE id = "${id}" GROUP BY item FOR UPDATE`)

		for (let i = 0; i < itemRows.length; i++) {
			if (this.app.itemdata[itemRows[i].item]) itemObj[itemRows[i].item] = itemRows[i].amount
		}

		return itemObj
	}

	async removeMoney (clanId, amount, serverSideGuildId = undefined) {
		await this.app.query(`UPDATE ${serverSideGuildId ? 'server_clans' : 'clans'} SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async removeMoneySafely (query, clanId, amount, serverSideGuildId = undefined) {
		await query(`UPDATE ${serverSideGuildId ? 'server_clans' : 'clans'} SET money = money - ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addMoney (clanId, amount, serverSideGuildId = undefined) {
		await this.app.query(`UPDATE ${serverSideGuildId ? 'server_clans' : 'clans'} SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addMoneySafely (query, clanId, amount, serverSideGuildId = undefined) {
		await query(`UPDATE ${serverSideGuildId ? 'server_clans' : 'clans'} SET money = money + ${parseInt(amount)} WHERE clanId = ${clanId}`)
	}

	async addLog (clanId, details, serverSideGuildId = undefined) {
		try {
			if (serverSideGuildId) {
				return this.app.query('INSERT INTO server_clan_logs (clanId, details, logTime, logDate) VALUES (?, ?, ?, NOW())', [clanId, details, new Date().getTime()])
			}

			return this.app.query('INSERT INTO clan_logs (clanId, details, logTime, logDate) VALUES (?, ?, ?, NOW())', [clanId, details, new Date().getTime()])
		}
		catch (err) {
			// continue
		}
	}
}

module.exports = Clans

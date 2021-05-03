class Items {
	constructor(app) {
		this.app = app
	}

	/**
     *
     * @param {string} id ID of user to add item to.
     * @param {string|Array<string>} item Item to add, can be array ex.(["crate|2","semi_rifle|1"])
     * @param {string|number|null} amount Amount of item to add, must be number.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addItem(id, item, amount, serverSideGuildId = undefined) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return 'item must be an array of items. ex. ["rock|1"]'
			}
			else if (serverSideGuildId) {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					// Store id and item in array to bulk insert x times # of items.
					const insertValues = Array(parseInt(itemToCheck[1])).fill([id, serverSideGuildId, itemToCheck[0]])

					await this.app.query('INSERT INTO server_user_items (userId, guildId, item) VALUES ?', [insertValues])
				}
			}
			else {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					// Store id and item in array to bulk insert x times # of items.
					const insertValues = Array(parseInt(itemToCheck[1])).fill([id, itemToCheck[0]])

					await this.app.query('INSERT INTO user_items (userId, item) VALUES ?', [insertValues])
				}
			}
		}
		else if (serverSideGuildId) {
			const insertValues = Array(parseInt(amount)).fill([id, serverSideGuildId, item])
			return this.app.query('INSERT INTO server_user_items (userId, guildId, item) VALUES ?', [insertValues])
		}
		else {
			const insertValues = Array(parseInt(amount)).fill([id, item])
			return this.app.query('INSERT INTO user_items (userId, item) VALUES ?', [insertValues])
		}
	}

	/**
     * Adds an item to user on global economy and all server-side economies
     * @param {string} id ID of user to add item to.
     * @param {string|Array<string>} item Item to add, can be array ex.(["crate|2","semi_rifle|1"])
     * @param {string|number|null} amount Amount of item to add, must be number.
     */
	async addItemGlobally(id, item, amount) {
		await this.addItem(id, item, amount)

		const serverSideEconomies = await this.app.query('SELECT guildId FROM server_scores WHERE userId = ?', [id])
		let added = 0

		for (const server of serverSideEconomies) {
			await this.addItem(id, item, amount, server.guildId)
			added++
		}

		return `Added items to global and ${added} server-side economies`
	}

	/**
     *
	 * @param {*} query The transaction query to use
     * @param {string} id ID of user to add item to.
     * @param {string|Array<string>} item   Item to add, can be array ex.(["crate|2","semi_rifle|1"])
     * @param {string|number|null} amount Amount of item to add, must be number.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addItemSafely(query, id, item, amount, serverSideGuildId = undefined) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return 'item must be an array of items. ex. ["rock|1"]'
			}
			else if (serverSideGuildId) {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					// Store id and item in array to bulk insert x times # of items.
					const insertValues = Array(parseInt(itemToCheck[1])).fill([id, serverSideGuildId, itemToCheck[0]])

					await query('INSERT INTO server_user_items (userId, guildId, item) VALUES ?', [insertValues])
				}
			}
			else {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					// Store id and item in array to bulk insert x times # of items.
					const insertValues = Array(parseInt(itemToCheck[1])).fill([id, itemToCheck[0]])

					await query('INSERT INTO user_items (userId, item) VALUES ?', [insertValues])
				}
			}
		}
		else if (serverSideGuildId) {
			const insertValues = Array(parseInt(amount)).fill([id, serverSideGuildId, item])
			return query('INSERT INTO server_user_items (userId, guildId, item) VALUES ?', [insertValues])
		}
		else {
			const insertValues = Array(parseInt(amount)).fill([id, item])
			return query('INSERT INTO user_items (userId, item) VALUES ?', [insertValues])
		}
	}

	/**
     *
     * @param {string} id ID of user to remove item from.
     * @param {string|Array<string>} item   Item to remove, can be an array ex.(["crate|2","semi_rifle|3"])
     * @param {string|number|null} amount Amount of item to remove.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeItem(id, item, amount, serverSideGuildId = undefined) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return 'item must be an array of items. ex. ["rock|1"]'
			}
			else if (serverSideGuildId) {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					await this.app.query(`DELETE FROM server_user_items WHERE userId = ${id} AND guildId = ${serverSideGuildId} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`)
				}
			}
			else {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					await this.app.query(`DELETE FROM user_items WHERE userId = ${id} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`)
				}
			}
		}
		else if (serverSideGuildId) {
			return this.app.query(`DELETE FROM server_user_items WHERE userId = ${id} AND guildId = ${serverSideGuildId} AND item = '${item}' LIMIT ${parseInt(amount)}`)
		}
		else {
			return this.app.query(`DELETE FROM user_items WHERE userId = ${id} AND item = '${item}' LIMIT ${parseInt(amount)}`)
		}
	}

	/**
     *
	 * @param {*} query The transaction query to use
     * @param {string} id ID of user to remove item from.
     * @param {string|Array<string>} item Item to remove, can be an array ex.(["crate|2","semi_rifle|3"])
     * @param {string|number|null} amount Amount of item to remove.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeItemSafely(query, id, item, amount, serverSideGuildId = undefined) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return 'item must be an array of items. ex. ["rock|1"]'
			}
			else if (serverSideGuildId) {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					await query(`DELETE FROM server_user_items WHERE userId = ${id} AND guildId = ${serverSideGuildId} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`)
				}
			}
			else {
				for (let i = 0; i < item.length; i++) {
					// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
					const itemToCheck = item[i].split('|')

					await query(`DELETE FROM user_items WHERE userId = ${id} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`)
				}
			}
		}
		else if (serverSideGuildId) {
			await query(`DELETE FROM server_user_items WHERE userId = ${id} AND guildId = ${serverSideGuildId} AND item = '${item}' LIMIT ${parseInt(amount)}`)
		}
		else {
			await query(`DELETE FROM user_items WHERE userId = ${id} AND item = '${item}' LIMIT ${parseInt(amount)}`)
		}
	}

	/**
     *
     * @param {*} userItems User's item object.
     * @param {*} item   Item to check user has, can be an array ex.(["assault_rifle|1","rock|2"])
     * @param {*} amount Amount of item check for.
     */
	hasItems(userItems, item, amount) {
		if (Array.isArray(item)) {
			if (item.length === 0) {
				return true
			}
			for (let i = 0; i < item.length; i++) {
				// do stuff for each item
				const itemToCheck = item[i].split('|')
				if (userItems[itemToCheck[0]] >= parseInt(itemToCheck[1])) {
					if (i === item.length - 1) {
						return true
					}
				}
				else {
					return false
				}
			}
		}
		else {
			if (userItems[item] >= parseInt(amount)) {
				return true
			}

			return false
		}
	}

	/**
     *
     * @param {*} itemCt Object containing the user's item count.
     * @param {number} amount Amount of items to check if user has space for
     */
	async hasSpace(itemCt, amount = 0) {
		console.log(`${itemCt.itemCt + parseInt(amount)} <= ${itemCt.maxCt}`)

		if ((itemCt.itemCt + parseInt(amount)) <= itemCt.maxCt) return true
		return false
	}

	async getItemCount(userItems, userRow, options = { cntBanners: false }) {
		options.cntBanners = options.cntBanners || false

		let totalItemCt = 0
		let bannerCt = 0

		for (const item in userItems) {
			if (this.app.itemdata[item] && userItems[item] > 0) {
				if (this.app.itemdata[item].isBanner && options.cntBanners) {
					totalItemCt += userItems[item]
					bannerCt += userItems[item]
				}
				else if (this.app.itemdata[item].isBanner) {
					bannerCt += userItems[item]
				}
				else if (!this.app.itemdata[item].isBanner) {
					totalItemCt += userItems[item]
				}
			}
		}

		if (this.app.itemdata[userRow.banner] !== undefined) {
			bannerCt++
		}

		return {
			itemCt: totalItemCt,
			bannerCt,
			maxCt: this.app.config.baseInvSlots + userRow.inv_slots,
			open: Math.max(0, (this.app.config.baseInvSlots + userRow.inv_slots) - totalItemCt),
			capacity: `${totalItemCt} / ${this.app.config.baseInvSlots + userRow.inv_slots}`
		}
	}

	/**
     *
     * @param {string} id User to retrieve items for (in an object format).
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getItemObject(id, serverSideGuildId = undefined) {
		const itemObj = {}
		let itemRows

		if (serverSideGuildId) {
			itemRows = await this.app.query(`SELECT item, COUNT(item) AS amount FROM server_user_items WHERE userId = "${id}" AND guildId = "${serverSideGuildId}" GROUP BY item`)
		}
		else {
			itemRows = await this.app.query(`SELECT item, COUNT(item) AS amount FROM user_items WHERE userId = "${id}" GROUP BY item`)
		}

		for (let i = 0; i < itemRows.length; i++) {
			if (this.app.itemdata[itemRows[i].item]) itemObj[itemRows[i].item] = itemRows[i].amount
		}

		return itemObj
	}

	/**
     * Retrieves items for a user and prevents queries from updating the items.
	 * @param {*} query
     * @param {string} id User to retrieve items for (in an object format).
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getItemObjectForUpdate(query, id, serverSideGuildId = undefined) {
		const itemObj = {}
		let itemRows

		if (serverSideGuildId) {
			itemRows = await query(`SELECT item, COUNT(item) AS amount FROM server_user_items WHERE userId = "${id}" AND guildId = "${serverSideGuildId}" GROUP BY item FOR UPDATE`)
		}
		else {
			itemRows = await query(`SELECT item, COUNT(item) AS amount FROM user_items WHERE userId = "${id}" GROUP BY item FOR UPDATE`)
		}

		for (let i = 0; i < itemRows.length; i++) {
			if (this.app.itemdata[itemRows[i].item]) itemObj[itemRows[i].item] = itemRows[i].amount
		}

		return itemObj
	}

	/**
     *
     * @param {*} items User's item object
     * @param {*} options
     * @returns {{onlyBanners:boolean,countBanners:boolean,countLimited:boolean}} Object with array for each item rarity, and value of all items in inventory
     */
	async getUserItems(items, options = { onlyBanners: false, countBanners: false, countLimited: true }) {
		options.onlyBanners = (options && options.onlyBanners) || false
		options.countBanners = (options && options.countBanners) || false
		options.countLimited = (options && options.countLimited) || true

		const ranged = []
		const melee = []
		const usables = []
		const ammo = []
		const resources = []
		const storage = []
		const banners = []
		let invValue = 0
		let itemCount = 0

		const filteredItems = Object.keys(this.app.itemdata).filter(item => {
			if (options.onlyBanners) {
				if (this.app.itemdata[item].isBanner) return true
				return false
			}
			else if (options.countBanners && options.countLimited) {
				return true
			}
			else if (!options.countBanners && options.countLimited) {
				if (!this.app.itemdata[item].isBanner) return true
				return false
			}
			else if (options.countBanners && !options.countLimited) {
				if (this.app.itemdata[item].isBanner && !this.app.itemdata[item].isSpecial) return true
				else if (!this.app.itemdata[item].isBanner && !this.app.itemdata[item].isSpecial) return true
				return false
			}
		})

		for (const key of filteredItems.sort(this.sortItemsHighLow.bind(this.app))) {
			if (items[key] >= 1) {
				const itemInfo = this.app.itemdata[key]
				const itemDisplay = `${itemInfo.icon}\`${key}\`(${items[key]})`

				switch (itemInfo.category) {
				case 'Ranged': ranged.push(itemDisplay); break
				case 'Melee': melee.push(itemDisplay); break
				case 'Item': usables.push(itemDisplay); break
				case 'Ammo': ammo.push(itemDisplay); break
				case 'Resource': resources.push(itemDisplay); break
				case 'Storage': storage.push(itemDisplay); break
				case 'Banner': banners.push(itemDisplay)
				}

				invValue += itemInfo.sell * items[key]
				itemCount += items[key]
			}
		}

		return {
			ranged,
			melee,
			usables,
			ammo,
			resources,
			storage,
			banners,
			invValue,
			itemCount
		}
	}

	/**
     *
     * @param {string} id User to retrieve badges for (in an array format).
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getBadges(id, serverSideGuildId = undefined) {
		const badgeArr = []
		let badges

		if (serverSideGuildId) {
			badges = await this.app.query(`SELECT badge FROM server_badges WHERE userId = "${id}" AND guildId = "${serverSideGuildId}"`)
		}
		else {
			badges = await this.app.query(`SELECT badge FROM badges WHERE userId = "${id}"`)
		}

		for (const badge of badges) {
			if (this.app.badgedata[badge.badge]) badgeArr.push(badge.badge)
		}

		return badgeArr
	}

	/**
     *
     * @param {string} userId ID of user to add badge to.
     * @param {string} badge Badge to add
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addBadge(userId, badge, serverSideGuildId = undefined) {
		return serverSideGuildId ?
			this.app.query(`INSERT IGNORE INTO server_badges (userId, guildId, badge, earned) VALUES (${userId}, ${serverSideGuildId}, '${badge}', ${new Date().getTime()})`) :
			this.app.query(`INSERT IGNORE INTO badges (userId, badge, earned) VALUES (${userId}, '${badge}', ${new Date().getTime()})`)
	}

	/**
     *
     * @param {string} userId ID of user to remove badge from.
     * @param {string} badge Badge to remove
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeBadge(userId, badge, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET badge = 'none' WHERE userId = ${userId} AND guildId = ${serverSideGuildId} AND badge = '${badge}'`)
			return this.app.query(`DELETE FROM server_badges WHERE userId = ${userId} AND guildId = ${serverSideGuildId} AND badge = '${badge}'`)
		}

		await this.app.query(`UPDATE scores SET badge = 'none' WHERE userId = ${userId} AND badge = '${badge}'`)
		return this.app.query(`DELETE FROM badges WHERE userId = ${userId} AND badge = '${badge}'`)
	}

	getTotalItmCountFromList(list) {
		if (list.length === 0) {
			return 0
		}
		let totalItemCt = 0
		for (let i = 0; i < list.length; i++) {
			// do stuff for each item
			// store amounts in array as ["rock|5","assault_rifle|2"] then use split("|")
			const itemToCheck = list[i].split('|')
			totalItemCt += parseInt(itemToCheck[1])
		}
		return totalItemCt
	}

	openBox(type, amount = 1, luck) {
		const itemsDisplay = []
		const finalItemsAmounts = []
		const items = []
		let xpToAdd = 0
		const weightedArr = this.generateWeightedArray(this.app.itemdata[type].rates, luck)

		for (let i = 0; i < amount; i++) {
			const rand = this.pickRandomItem(type, weightedArr)
			const splitRand = rand.item.split('|')

			xpToAdd += rand.xp
			finalItemsAmounts.push(rand.item)
			itemsDisplay.push(`${(splitRand[1] > 1 ? `${splitRand[1]}x ` : '') + this.app.itemdata[splitRand[0]].icon}\`${splitRand[0]}\``)
			items.push(splitRand[0])
		}

		return {
			xp: xpToAdd,
			itemAmounts: finalItemsAmounts,
			display: itemsDisplay,
			items
		}
	}

	generateWeightedArray(rates, luck) {
		const weightedArr = []
		let luckMltplr = 0

		Object.keys(rates).forEach(percentage => {
			if (parseFloat(percentage) <= 25) {
				luckMltplr = luck / 2
			}
			else {
				luckMltplr = 0
			}

			// Multiply the percentage by 2 for accuracy, 0.5 => 1, increase for better accuracy ie. 0.2 => 1 would require multiplier of 5
			for (let i = 0; i < (parseFloat(percentage) * 2) + luckMltplr; i++) {
				weightedArr.push(percentage)
			}
		})

		return weightedArr
	}

	pickRandomItem(type, weightedArray) {
		const rand = weightedArray[Math.floor(Math.random() * weightedArray.length)]
		const rewards = this.app.itemdata[type].rates[rand].items

		return {
			xp: this.app.itemdata[type].rates[rand].xp,
			item: rewards[Math.floor(Math.random() * rewards.length)]
		}
	}

	/**
     * Gets random items from a user, can also return multiple of the same item.
     * @param {object} userItems User's item object.
     * @param {number} amount Amount of items to get
     */
	async getRandomUserItems(userItems, amount) {
		let randArr = []

		for (const item in userItems) {
			if (this.app.itemdata[item].canBeStolen) {
				for (let i = 0; i < userItems[item]; i++) {
					randArr.push(item)
				}
			}
		}

		// no amount specified, get amount based on user item count.
		if (!amount && amount !== 0) {
			if (randArr.length === 0) {
				amount = 0
			}
			else if (randArr.length <= 9) {
				amount = 2
			}
			else {
				amount = Math.floor(randArr.length / 4)
			}
		}

		randArr = randArr.sort(() => 0.5 - Math.random())

		const results = randArr.slice(0, amount)
		const amountResults = []

		for (let i = 0; i < results.length; i++) {
			const exists = amountResults.filter(item => item.split('|')[0] === results[i])

			if (!exists.length) {
				const sameItems = results.filter(item => item === results[i])

				amountResults.push(`${results[i]}|${sameItems.length}`)
			}
		}

		return {
			items: results,
			display: this.getDisplay(amountResults.sort(this.sortItemsHighLow.bind(this.app))),
			amounts: amountResults
		}
	}

	sortItemsLowHigh(a, b) {
		if (a.includes('|')) {
			a = a.split('|')[0]
			b = b.split('|')[0]
		}

		const aitem = this.itemdata[a]
		const bitem = this.itemdata[b]

		if (bitem.tier > aitem.tier) return -1

		else if (bitem.tier < aitem.tier) return 1

		else if (b > a) return -1

		else if (b < a) return 1

		return 0
	}

	sortItemsHighLow(a, b) {
		if (a.includes('|')) {
			a = a.split('|')[0]
			b = b.split('|')[0]
		}

		const aitem = this.itemdata[a]
		const bitem = this.itemdata[b]

		if (bitem.tier < aitem.tier) return -1

		else if (bitem.tier > aitem.tier) return 1

		else if (b > a) return -1

		else if (b < a) return 1

		return 0
	}

	combineItems(itemList) {
		const nameArr = []
		const amountArr = []
		const finalArr = []

		for (let i = 0; i < itemList.length; i++) {
			const item = itemList[i].split('|')

			const nameArrIndex = nameArr.indexOf(item[0])

			if (nameArrIndex !== -1) {
				amountArr[nameArrIndex] = parseInt(amountArr[nameArrIndex]) + parseInt(item[1])
			}
			else {
				nameArr.push(item[0])
				amountArr.push(item[1])
			}
		}

		for (let i = 0; i < nameArr.length; i++) {
			finalArr.push(`${nameArr[i]}|${amountArr[i]}`)
		}

		return finalArr
	}

	getDisplay(itemList) {
		const combined = this.combineItems(itemList)
		const finalArr = []

		for (let i = 0; i < combined.length; i++) {
			const itemAmnt = combined[i].split('|')

			finalArr.push(`**${itemAmnt[1]}x** ${this.app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\``)
		}

		return finalArr
	}
}

module.exports = Items

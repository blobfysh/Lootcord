const Canvas = require('canvas')

Canvas.registerFont('src/resources/fonts/BebasNeue-Regular.ttf', { family: 'Bebas Neue' })

let oldPlayers

try {
	oldPlayers = require('../resources/json/og_looters')
}
catch (err) {
	oldPlayers = []
}

class Player {
	constructor (app) {
		this.app = app
	}

	/**
     *
     * @param {string} id ID of player to get information for
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getRow (id, serverSideGuildId = undefined) {
		return serverSideGuildId ?
			(await this.app.query('SELECT * FROM server_scores WHERE userId = ? AND guildId = ? AND userId > 0', [id, serverSideGuildId]))[0] :
			(await this.app.query('SELECT * FROM scores WHERE userId = ? AND userId > 0', [id]))[0]
	}

	/**
     * Retrieve row for user and prevents queries from updating the row.
	 * @param {*} query
     * @param {string} id ID of player to get information for
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getRowForUpdate (query, id, serverSideGuildId = undefined) {
		return serverSideGuildId ?
			(await query('SELECT * FROM server_scores WHERE userId = ? AND guildId = ? AND userId > 0 FOR UPDATE', [id, serverSideGuildId]))[0] :
			(await query('SELECT * FROM scores WHERE userId = ? AND userId > 0 FOR UPDATE', [id]))[0]
	}

	async createAccount (id, serverSideGuildId = undefined) {
		let message

		if (serverSideGuildId) {
			await this.app.query(insertServerScoreSQL, [id, serverSideGuildId, new Date().getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none'])

			message = {
				content: `**Thanks for playing server-side Lootcord in ${this.app.bot.guilds.get(serverSideGuildId).name}!**\n` +
					'Lootcord is a Rust themed fighting bot where you must collect as much loot as possible. There are many ways to get loot: you can use weapons to ' +
					'attack other players, gamble scrap, play minigames, trade, and much more. When you kill another player, you\'ll steal some of their loot!\n\n' +
					`<:hapdogg:841964121858506782> Here, take this ${this.app.itemdata.crate.icon}\`crate\`. ` +
					'The items it drops aren\'t too great but it should get you started.\nOpen it to see what item you get: `t-use crate`. You\'ll see the item in your `inventory`.\n\n' +
					'Get more crates by using commands such as `farm` and `daily`. Once you get a weapon, try attacking your friend!\n\n' +
					'**Some handy guides:**\nGetting started: <https://lootcord.com/guides/getting-started/>\nAttacking: <https://lootcord.com/guides/attacks/>\nIncreasing inventory space: <https://lootcord.com/guides/inventory-space/>\n\n' +
					'If you still need help we\'re here for you in the support server: https://discord.gg/apKSxuE - We also run monthly challenges where the winner receives <:nitro:841973839659270144> Discord Nitro!\n\n' +
					'I wish you luck on your journey to become powerful! - 💙 blobfysh'
			}
		}
		else {
			await this.app.query(insertScoreSQL, [id, new Date().getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none'])

			message = {
				content: '**Thanks for playing Lootcord!**\n' +
					'Lootcord is a Rust themed fighting bot where you must collect as much loot as possible. There are many ways to get loot: you can use weapons to ' +
					'attack other players, gamble scrap, play minigames, trade, and much more. When you kill another player, you\'ll steal some of their loot!\n\n' +
					`<:hapdogg:841964121858506782> Here, take this ${this.app.itemdata.crate.icon}\`crate\`. ` +
					'The items it drops aren\'t too great but it should get you started.\nOpen it to see what item you get: `t-use crate`. You\'ll see the item in your `inventory`.\n\n' +
					'Get more crates by using commands such as `farm` and `daily`. Once you get a weapon, try attacking your friend!\n\n' +
					'**Some handy guides:**\nGetting started: <https://lootcord.com/guides/getting-started/>\nAttacking: <https://lootcord.com/guides/attacks/>\nIncreasing inventory space: <https://lootcord.com/guides/inventory-space/>\n\n' +
					'If you still need help we\'re here for you in the support server: https://discord.gg/apKSxuE - <:nitro:841973839659270144> We also run monthly challenges where the winner receives Discord Nitro!\n\n' +
					'I wish you luck on your journey to become powerful! - 💙 blobfysh'
			}
		}

		// free item!
		await this.app.itm.addItem(id, 'crate', 1, serverSideGuildId)

		this.app.common.messageUser(id, message)

		if (oldPlayers.includes(id)) {
			await this.app.itm.addBadge(id, 'og_looter', serverSideGuildId)
		}
	}

	/**
     *
     * @param {string} id ID of player to activate
     * @param {string} guild ID of guild to activate player in
     */
	async activate (id, guild) {
		await this.app.query(`INSERT INTO userguilds (userId, guildId) VALUES (${id}, ${guild})`)
	}

	/**
     *
     * @param {string} id ID of user to deactivate
     * @param {string} guild ID of guild to deactivate user from
     */
	async deactivate (id, guild) {
		// delete user from server
		await this.app.query(`DELETE FROM userguilds WHERE userId = ${id} AND guildId = ${guild}`)
	}

	/**
     *
     * @param {string} id ID of user to check
     * @param {string} guild Guild to check if user is active in
     */
	async isActive (id, guild) {
		if ((await this.app.query(`SELECT * FROM userguilds WHERE userId = ${id} AND guildId = ${guild}`)).length) {
			return true
		}

		return false
	}

	/**
     * Returns an icon based on how much health player has
     * @param {number} curHP Player's current health
     * @param {number} maxHP Player's maximum health
     */
	getHealthIcon (curHP, maxHP, nextLine = false) {
		const hpPerBar = maxHP / 5
		let hpStr = ''

		for (let i = 0; i < 5; i++) {
			const barPerc = (curHP - (hpPerBar * i)) / hpPerBar

			if (i === 0) {
				if (barPerc >= 1) {
					hpStr += this.app.icons.health.start_full
				}
				else if (barPerc >= 0.75) {
					hpStr += this.app.icons.health.start_75
				}
				else if (barPerc >= 0.5) {
					hpStr += this.app.icons.health.start_50
				}
				else if (barPerc > 0) {
					hpStr += this.app.icons.health.start_25
				}
				else {
					hpStr += this.app.icons.health.empty
				}
			}
			else if (i === 4) {
				if (barPerc >= 1) {
					hpStr += this.app.icons.health.end_full
				}
				else if (barPerc >= 0.75) {
					hpStr += this.app.icons.health.percent_75
				}
				else if (barPerc >= 0.5) {
					hpStr += this.app.icons.health.percent_50
				}
				else if (barPerc >= 0.25) {
					hpStr += this.app.icons.health.percent_25
				}
				else {
					hpStr += this.app.icons.health.empty
				}
			}

			// middle health block
			else if (barPerc >= 1) {
				hpStr += this.app.icons.health.mid_full
			}
			else if (barPerc >= 0.75) {
				hpStr += this.app.icons.health.percent_75
			}
			else if (barPerc >= 0.5) {
				hpStr += this.app.icons.health.percent_50
			}
			else if (barPerc >= 0.25) {
				hpStr += this.app.icons.health.percent_25
			}
			else {
				hpStr += this.app.icons.health.empty
			}
		}

		return hpStr
	}

	/**
     *
     * @param {string} id ID of player to remove from
     * @param {number} amount Amount to remove
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeMoney (id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET money = money - ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.app.query(`UPDATE scores SET money = money - ${parseInt(amount)} WHERE userId = ${id}`)

			this.app.query(insertTransaction, [id, 0, amount])
		}
	}

	/**
     *
	 * @param {*} query The transaction query to use
     * @param {string} id ID of player to remove from
     * @param {number} amount Amount to remove
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeMoneySafely (query, id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await query(`UPDATE server_scores SET money = money - ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await query(`UPDATE scores SET money = money - ${parseInt(amount)} WHERE userId = ${id}`)

			this.app.query(insertTransaction, [id, 0, amount])
		}
	}

	/**
     *
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of money to add.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addMoney (id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET money = money + ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.app.query(`UPDATE scores SET money = money + ${parseInt(amount)} WHERE userId = ${id}`)

			this.app.query(insertTransaction, [id, amount, 0])
		}
	}

	/**
     *
	 * @param {*} query The transaction query to use
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of money to add.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addMoneySafely (query, id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await query(`UPDATE server_scores SET money = money + ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await query(`UPDATE scores SET money = money + ${parseInt(amount)} WHERE userId = ${id}`)

			this.app.query(insertTransaction, [id, amount, 0])
		}
	}

	/**
     *
     * @param {*} id ID of user to add xp to.
     * @param {*} amount Amount of xp to add.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addPoints (id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET points = points + ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.app.query(`UPDATE scores SET points = points + ${parseInt(amount)} WHERE userId = ${id}`)
		}
	}

	async subHealth (id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query('UPDATE server_scores SET health = health - ? WHERE userId = ? AND guildId = ?', [amount, id, serverSideGuildId])
		}
		else {
			await this.app.query('UPDATE scores SET health = health - ? WHERE userId = ?', [amount, id])
		}
	}

	async addHealth (id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query('UPDATE server_scores SET health = health + ? WHERE userId = ? AND guildId = ?', [amount, id, serverSideGuildId])
		}
		else {
			await this.app.query('UPDATE scores SET health = health + ? WHERE userId = ?', [amount, id])
		}
	}

	/**
     * Increment a stat of the player by a value.
     * @param {*} id ID of user
     * @param {*} stat Stat to increase
     * @param {*} value Value to increase stat by
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addStat (id, stat, value, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query('INSERT INTO server_stats (userId, guildId, stat, value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = value + ?', [id, serverSideGuildId, stat, value, value])
		}
		else {
			await this.app.query('INSERT INTO stats (userId, stat, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = value + ?', [id, stat, value, value])
		}
	}

	/**
     * Obtain the value of a stat for a given player
     * @param {*} id ID of user
     * @param {*} stat Stat to retrieve value of
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getStat (id, stat, serverSideGuildId = undefined) {
		let stats

		if (serverSideGuildId) {
			stats = (await this.app.query('SELECT * FROM server_stats WHERE userId = ? AND guildId = ? AND stat = ?', [id, serverSideGuildId, stat]))[0]
		}
		else {
			stats = (await this.app.query('SELECT * FROM stats WHERE userId = ? AND stat = ?', [id, stat]))[0]
		}

		return stats ? stats.value : 0
	}

	/**
	 * Resets stat for user
	 * @param {string} id ID of user
	 * @param {string} stat stat to reset to 0
	 * @param {string|undefined} serverSideGuildId used for server-side economies
	 */
	async resetStat (id, stat, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query('UPDATE server_stats SET value = 0 WHERE userId = ? AND guildId = ? AND stat = ?', [id, serverSideGuildId, stat])
		}
		else {
			await this.app.query('UPDATE stats SET value = 0 WHERE userId = ? AND stat = ?', [id, stat])
		}
	}

	/**
     *
     * @param {string} badge Badge to get icon for
     */
	getBadge (badge) {
		const badgeInfo = this.app.badgedata[badge]

		if (badgeInfo) {
			return badgeInfo.icon
		}
		return ''
	}

	/**
     * Get the armor user is wearing.
     * @param {*} id ID of user
	 * @param {string|undefined} [serverSideGuildId] server-side economy guild id to retrieve users armor for
	 * @returns {Promise<string|undefined>}
     */
	async getArmor (id, serverSideGuildId = undefined) {
		let armor

		if (serverSideGuildId) {
			armor = await this.app.cache.get(`shield|${id}|${serverSideGuildId}`)
		}
		else {
			armor = await this.app.cache.get(`shield|${id}`)
		}

		if (this.app.itemdata[armor]) {
			return armor
		}

		return undefined
	}

	async getLevelImage (playerImage, level) {
		const WIDTH = 108
		const HEIGHT = 128
		const image = await Canvas.loadImage('src/resources/images/LvlUp2.png')
		// const overlay = await Canvas.loadImage('src/resources/images/LvlUpChristmasOverlay.png')
		const avatar = await Canvas.loadImage(playerImage)
		const canvas = Canvas.createCanvas(WIDTH, HEIGHT)
		const ctx = canvas.getContext('2d')

		// background
		ctx.drawImage(image, 0, 0, WIDTH, HEIGHT)

		// avatar
		ctx.drawImage(avatar, 22, 16, 64, 64)

		/* overlay
		ctx.drawImage(overlay, 0, 0, WIDTH, HEIGHT)
		*/

		// text
		ctx.fillStyle = '#E8E8E8'
		ctx.font = '45px Bebas Neue'
		ctx.textAlign = 'center'
		// ctx.lineWidth = 3
		// ctx.strokeStyle = '#161616'
		// ctx.strokeText(`LVL ${level}`, WIDTH / 2, 120)
		ctx.fillText(`LVL ${level}`, WIDTH / 2, 120)

		return canvas.toBuffer()
	}
}

const insertScoreSQL = `
INSERT IGNORE INTO scores (
    userId,
    createdAt,
    money,
    level,
    health,
    maxHealth,
    scaledDamage,
    backpack,
    armor,
    ammo,
    badge,
    inv_slots,
    points,
    kills,
    deaths,
    stats,
    luck,
    used_stats,
    status,
    banner,
    language,
    voteCounter,
    clanId,
    clanRank,
    lastActive,
    notify1,
    notify2,
    notify3,
    prestige,
    discoinLimit,
	bmLimit,
	bleed,
	burn)
    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us',
        0, 0, 0, NOW(), 0, 0, 0, 0, 0, 0, 0, 0
    )
`

const insertServerScoreSQL = `
INSERT IGNORE INTO server_scores (
    userId,
	guildId,
    createdAt,
    money,
    level,
    health,
    maxHealth,
    scaledDamage,
    backpack,
    armor,
    ammo,
    badge,
    inv_slots,
    points,
    kills,
    deaths,
    stats,
    luck,
    used_stats,
    status,
    banner,
    language,
    voteCounter,
    clanId,
    clanRank,
    lastActive,
    notify1,
    notify2,
    notify3,
    prestige,
    discoinLimit,
	bmLimit,
	bleed,
	burn)
    VALUES (
        ?,
		?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us',
        0, 0, 0, NOW(), 0, 0, 0, 0, 0, 0, 0, 0
    )
`

const insertTransaction = `
INSERT INTO transactions (
    userId,
    date,
    gained,
    lost)
    VALUES (
        ?, NOW(), ?, ?
    )
`

module.exports = Player

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
	constructor(app) {
		this.app = app
	}

	/**
     *
     * @param {string} id ID of player to get information for
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async getRow(id, serverSideGuildId = undefined) {
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
	async getRowForUpdate(query, id, serverSideGuildId = undefined) {
		return serverSideGuildId ?
			(await query('SELECT * FROM server_scores WHERE userId = ? AND guildId = ? AND userId > 0 FOR UPDATE', [id, serverSideGuildId]))[0] :
			(await query('SELECT * FROM scores WHERE userId = ? AND userId > 0 FOR UPDATE', [id]))[0]
	}

	async createAccount(id, serverSideGuildId = undefined) {
		let message

		if (serverSideGuildId) {
			await this.app.query(insertServerScoreSQL, [id, serverSideGuildId, new Date().getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none'])

			message = new this.app.Embed()
				.setTitle('Thanks for playing Lootcord!')
				.setColor(13451564)
				.setThumbnail(this.app.bot.user.avatarURL)
				.setDescription(`__Here's a list of useful commands:__
				\`inv\` - View your items, health, money, and currently equipped storage container.
				\`profile\` - View various statistic about yourself or another player.
				\`use\` - Uses an item on yourself or attacks another player with said item.
				\`items\` - View a full list of items. Specify an item to see specific information about it.
				\`buy\` - Purchase items, you can also specify an amount to purchase.
				\`sell\` - Sell your items for Lootcoin.
				\`leaderboard\` - View the best players in your server or globally.
				\`mysettings\` - Manage your settings such as notifications.
				\`farm\` - Go farming for loot every hour.
				\`daily\` - Claim a ${this.app.itemdata.military_crate.icon}\`military_crate\` every day.
				\`cooldowns\` - View all your command cooldowns.

				You can also use \`t-help <command>\` to see detailed command information and examples.

				Confused? Check out the [faq](https://lootcord.com/rules) and these [guides](https://lootcord.com/guides)!

				Join the [support server](https://discord.gg/apKSxuE) if you need more help!`)
				.addField('Items Received', `1x ${this.app.itemdata.crate.icon}\`crate\`\nOpen it by __using__ it: \`t-use crate\`\n\nOnce you get a weapon, you can attack another player by __using__ a weapon on them: \`t-use rock @user\``)
				.setFooter('This message means that you have created an account in a server with server-side economy enabled.')
		}
		else {
			await this.app.query(insertScoreSQL, [id, new Date().getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none'])

			message = new this.app.Embed()
				.setTitle('Thanks for playing Lootcord!')
				.setColor(13451564)
				.setThumbnail(this.app.bot.user.avatarURL)
				.setDescription(`Here's a list of useful commands:\n
				\`inv\` - View your items, health, money, and currently equipped storage container.
				\`profile\` - View various statistic about yourself or another player.
				\`use\` - Uses an item on yourself or attacks another player with said item.
				\`items\` - View a full list of items. Specify an item to see specific information about it.
				\`buy\` - Purchase items, you can also specify an amount to purchase.
				\`sell\` - Sell your items for Lootcoin.
				\`leaderboard\` - View the best players in your server or globally.
				\`mysettings\` - Manage your settings such as notifications.
				\`farm\` - Go farming for loot every hour.
				\`daily\` - Claim a ${this.app.itemdata.military_crate.icon}\`military_crate\` every day.
				\`cooldowns\` - View all your command cooldowns.

				You can also use \`t-help <command>\` to see detailed command information and examples.

				⚠️ **ALT ACCOUNTS ARE NOT ALLOWED**, make sure to follow these [rules](https://lootcord.com/rules)!
				Confused? Check out the [faq](https://lootcord.com/rules) and these [guides](https://lootcord.com/guides)!

				Join the [support server](https://discord.gg/apKSxuE) if you need more help!`)
				.addField('Items Received', `1x ${this.app.itemdata.crate.icon}\`crate\`\nOpen it by __using__ it: \`t-use crate\`\n\nOnce you get a weapon, you can attack another player by __using__ a weapon on them: \`t-use rock @user\``)
				.setFooter('This message will only be sent the first time your account is created.')
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
	async activate(id, guild) {
		await this.app.query(`INSERT INTO userGuilds (userId, guildId) VALUES (${id}, ${guild})`)
	}

	/**
     *
     * @param {string} id ID of user to deactivate
     * @param {string} guild ID of guild to deactivate user from
     */
	async deactivate(id, guild) {
		// delete user from server
		await this.app.query(`DELETE FROM userGuilds WHERE userId = ${id} AND guildId = ${guild}`)
	}

	/**
     *
     * @param {string} id ID of user to check
     * @param {string} guild Guild to check if user is active in
     */
	async isActive(id, guild) {
		if ((await this.app.query(`SELECT * FROM userGuilds WHERE userId = ${id} AND guildId = ${guild}`)).length) {
			return true
		}

		return false
	}

	/**
     * Returns an icon based on how much health player has
     * @param {number} curHP Player's current health
     * @param {number} maxHP Player's maximum health
     */
	getHealthIcon(curHP, maxHP, nextLine = false) {
		const numHearts = Math.ceil(maxHP / 25)
		let hpStr = ''

		for (let i = 0; i < numHearts; i++) {
			const hpPerc = curHP / 25

			// add new line of hearts every 5 hearts
			if (nextLine && i % 5 === 0) hpStr += '\n'

			if (hpPerc >= 1) {
				hpStr += this.app.icons.health.full

				curHP -= 25
			}
			else if (hpPerc > 0) {
				if (hpPerc >= 0.66) {
					hpStr += this.app.icons.health.percent_75
				}
				else if (hpPerc >= 0.33) {
					hpStr += this.app.icons.health.percent_50
				}
				else {
					hpStr += this.app.icons.health.percent_25
				}

				curHP = 0
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
	async removeMoney(id, amount, serverSideGuildId = undefined) {
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
	async removeMoneySafely(query, id, amount, serverSideGuildId = undefined) {
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
	async addMoney(id, amount, serverSideGuildId = undefined) {
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
	async addMoneySafely(query, id, amount, serverSideGuildId = undefined) {
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
     * @param {string} id ID of player to remove from
     * @param {number} amount Scrap to remove
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async removeScrap(id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET scrap = scrap - ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.app.query(`UPDATE scores SET scrap = scrap - ${parseInt(amount)} WHERE userId = ${id}`)
		}
	}

	/**
     *
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of scrap to add.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addScrap(id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET scrap = scrap + ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.app.query(`UPDATE scores SET scrap = scrap + ${parseInt(amount)} WHERE userId = ${id}`)
		}
	}

	/**
     *
     * @param {*} id ID of user to add xp to.
     * @param {*} amount Amount of xp to add.
	 * @param {string|undefined} [serverSideGuildId] used for server-side economies
     */
	async addPoints(id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query(`UPDATE server_scores SET points = points + ${parseInt(amount)} WHERE userId = ${id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.app.query(`UPDATE scores SET points = points + ${parseInt(amount)} WHERE userId = ${id}`)
		}
	}

	async subHealth(id, amount, serverSideGuildId = undefined) {
		if (serverSideGuildId) {
			await this.app.query('UPDATE server_scores SET health = health - ? WHERE userId = ? AND guildId = ?', [amount, id, serverSideGuildId])
		}
		else {
			await this.app.query('UPDATE scores SET health = health - ? WHERE userId = ?', [amount, id])
		}
	}

	async addHealth(id, amount, serverSideGuildId = undefined) {
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
	async addStat(id, stat, value, serverSideGuildId = undefined) {
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
	async getStat(id, stat, serverSideGuildId = undefined) {
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
     *
     * @param {string} badge Badge to get icon for
     */
	getBadge(badge) {
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
	async getArmor(id, serverSideGuildId = undefined) {
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

	async getLevelImage(playerImage, level) {
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
    scrap,
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
    power,
    max_power,
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
        500,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us',
        0, 5, 5, 0, 0, NOW(), 0, 0, 0, 0, 0, 0, 0, 0
    )
`

const insertServerScoreSQL = `
INSERT IGNORE INTO server_scores (
    userId,
	guildId,
    createdAt,
    money,
    scrap,
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
    power,
    max_power,
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
        500,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us',
        0, 5, 5, 0, 0, NOW(), 0, 0, 0, 0, 0, 0, 0, 0
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

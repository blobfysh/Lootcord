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
     * @param {string} id ID to check if account exists
     */
	async hasAccount(id) {
		if (await this.getRow(id)) return true

		return false
	}

	/**
     *
     * @param {string} id ID of player to get information for
     */
	async getRow(id) {
		return (await this.app.query('SELECT * FROM scores WHERE userId = ? AND userId > 0', [id]))[0]
	}

	async createAccount(id) {
		await this.app.query(insertScoreSQL, [id, new Date().getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none'])
		await this.app.itm.addItem(id, 'crate', 1)

		const newPlayer = new this.app.Embed()
			.setTitle('Thanks for playing Lootcord!')
			.setColor(13451564)
			.setThumbnail(this.app.bot.user.avatarURL)
			.setDescription(`Here's a list of commands you'll use the most:\n
        \`inv\` - View your items, health, money, and currently equipped storage container.
        \`profile\` - View various statistic about yourself or another player.
        \`use\` - Uses an item on yourself or attacks another player with said item.
        \`items\` - View a full list of items. Specify an item to see specific information about it.
        \`buy\` - Purchase items, you can also specify an amount to purchase.
        \`sell\` - Sell your items for Lootcoin.
        \`leaderboard\` - View the best players in your server or globally.
        \`mysettings\` - Manage your settings such as notifications.
        \`hourly\` - Claim a ${this.app.itemdata.crate.icon}\`crate\` every hour.
        \`daily\` - Claim a ${this.app.itemdata.military_crate.icon}\`military_crate\` every day.
        \`cooldowns\` - View all your command cooldowns.

        You can also use \`t-help <command>\` to see detailed command information and examples.

        ⚠️ **ALT ACCOUNTS ARE NOT ALLOWED**, make sure to follow these [rules](https://lootcord.com/rules)!
        Check out the [faq](https://lootcord.com/rules) and these [guides](https://lootcord.com/guides) if you are confused!

        Join the [support server](https://discord.gg/apKSxuE) if you need more help!`)
			.addField('Items Received', `1x ${this.app.itemdata.crate.icon}\`crate\`\nOpen it by __using__ it: \`t-use crate\`\n\nOnce you get a weapon, you can attack another player by __using__ a weapon on them: \`t-use rock @user\``)
			.setFooter('This message will only be sent the first time your account is created.')
		this.app.common.messageUser(id, newPlayer)

		if (oldPlayers.includes(id)) {
			await this.app.itm.addBadge(id, 'og_looter')
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
     * Checks if players has the amount specified
     * @param {string} id ID of player to check
     * @param {number} amount Amount of money to check
     */
	async hasMoney(id, amount) {
		const row = await this.getRow(id)

		if (row.money >= amount) {
			return true
		}

		return false
	}

	/**
     *
     * @param {string} id ID of player to remove from
     * @param {number} amount Amount to remove
     */
	async removeMoney(id, amount) {
		await this.app.query(`UPDATE scores SET money = money - ${parseInt(amount)} WHERE userId = ${id}`)

		this.app.query(insertTransaction, [id, 0, amount])
	}

	/**
     *
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of money to add.
     */
	async addMoney(id, amount) {
		await this.app.query(`UPDATE scores SET money = money + ${parseInt(amount)} WHERE userId = ${id}`)

		this.app.query(insertTransaction, [id, amount, 0])
	}

	/**
     * Checks if players has the amount specified
     * @param {string} id ID of player to check
     * @param {number} amount Amount of scrap to check
     */
	async hasScrap(id, amount) {
		const row = await this.getRow(id)

		if (row.scrap >= amount) {
			return true
		}

		return false
	}

	/**
     *
     * @param {string} id ID of player to remove from
     * @param {number} amount Scrap to remove
     */
	async removeScrap(id, amount) {
		await this.app.query(`UPDATE scores SET scrap = scrap - ${parseInt(amount)} WHERE userId = ${id}`)
	}

	/**
     *
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of scrap to add.
     */
	async addScrap(id, amount) {
		await this.app.query(`UPDATE scores SET scrap = scrap + ${parseInt(amount)} WHERE userId = ${id}`)
	}

	/**
     *
     * @param {*} id ID of user to add xp to.
     * @param {*} amount Amount of xp to add.
     */
	async addPoints(id, amount) {
		await this.app.query(`UPDATE scores SET points = points + ${parseInt(amount)} WHERE userId = ${id}`)
	}

	/**
     * Increment a stat of the player by a value.
     * @param {*} id ID of user
     * @param {*} stat Stat to increase
     * @param {*} value Value to increase stat by
     */
	async addStat(id, stat, value) {
		await this.app.query('INSERT INTO stats (userId, stat, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = value + ?', [id, stat, value, value])
	}

	/**
     * Obtain the value of a stat for a given player
     * @param {*} id ID of user
     * @param {*} stat Stat to retrieve value of
     */
	async getStat(id, stat) {
		const stats = (await this.app.query('SELECT * FROM stats WHERE userId = ? AND stat = ?', [id, stat]))[0]

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
     */
	async getArmor(id) {
		const armor = await this.app.cache.get(`shield|${id}`)

		if (this.app.itemdata[armor]) {
			return armor
		}

		return undefined
	}

	/**
     *
     * @param {*} message Message of player to check level up for.
     */
	async checkLevelXP(message, row) {
		try {
			const xp = this.app.common.calculateXP(row.points, row.level)

			if (row.points >= xp.totalNeeded) {
				const craftables = Object.keys(this.app.itemdata).filter(item => this.app.itemdata[item].craftedWith !== '' && this.app.itemdata[item].craftedWith.level === row.level + 1)
				let levelItem = ''

				craftables.sort(this.app.itm.sortItemsHighLow.bind(this.app))

				await this.app.query(`UPDATE scores SET points = points + 1, level = level + 1 WHERE userId = ${message.author.id}`)

				if ((row.level + 1) % 5 === 0 && row.level + 1 >= 10) {
					levelItem = `${this.app.itemdata.elite_crate.icon}\`elite_crate\``
					await this.app.itm.addItem(message.author.id, 'elite_crate', 1)
				}
				else if ((row.level + 1) > 15) {
					levelItem = `${this.app.itemdata.supply_signal.icon}\`supply_signal\``
					await this.app.itm.addItem(message.author.id, 'supply_signal', 1)
				}
				else if ((row.level + 1) > 10) {
					levelItem = `2x ${this.app.itemdata.military_crate.icon}\`military_crate\``
					await this.app.itm.addItem(message.author.id, 'military_crate', 2)
				}
				else if ((row.level + 1) > 5) {
					levelItem = `${this.app.itemdata.military_crate.icon}\`military_crate\``
					await this.app.itm.addItem(message.author.id, 'military_crate', 1)
				}
				else {
					levelItem = `1x ${this.app.itemdata.crate.icon}\`crate\``
					await this.app.itm.addItem(message.author.id, 'crate', 1)
				}

				if (row.level + 1 >= 5) {
					await this.app.itm.addBadge(message.author.id, 'loot_goblin')
				}
				if (row.level + 1 >= 10) {
					await this.app.itm.addBadge(message.author.id, 'loot_fiend')
				}
				if (row.level + 1 >= 20) {
					await this.app.itm.addBadge(message.author.id, 'loot_legend')
				}

				const guildRow = await this.app.common.getGuildInfo(message.channel.guild.id)

				try {
					const lvlUpImage = await this.getLevelImage(message.author.avatarURL, row.level + 1)

					if (guildRow.levelChan !== undefined && guildRow.levelChan !== '' && guildRow.levelChan !== 0) {
						try {
							await this.app.bot.createMessage(guildRow.levelChan, {
								content: `<@${message.author.id}> leveled up!\n**Reward:** ${levelItem}${craftables.length ? `\n\nYou can now craft the following items:\n${craftables.map(item => `${this.app.itemdata[item].icon}\`${item}\``).join(', ')}` : ''}`
							}, {
								file: lvlUpImage,
								name: 'userLvl.jpeg'
							})
						}
						catch (err) {
							// level channel not found
							console.warn('Could not find level channel.')
						}
					}
					else {
						message.channel.createMessage({
							content: `<@${message.author.id}> level up!\n**Reward:** ${levelItem}${craftables.length ? `\n\nYou can now craft the following items:\n${craftables.map(item => `${this.app.itemdata[item].icon}\`${item}\``).join(', ')}` : ''}`
						}, {
							file: lvlUpImage,
							name: 'userLvl.jpeg'
						})
					}
				}
				catch (err) {
					console.log(err)
					// error creating level up image
				}
			}
		}
		catch (err) {
			console.log(err)
		}
	}

	async getLevelImage(playerImage, level) {
		const WIDTH = 108
		const HEIGHT = 128
		const image = await Canvas.loadImage('src/resources/images/LvlUpChristmas.png')
		const overlay = await Canvas.loadImage('src/resources/images/LvlUpChristmasOverlay.png')
		const avatar = await Canvas.loadImage(playerImage)
		const canvas = Canvas.createCanvas(WIDTH, HEIGHT)
		const ctx = canvas.getContext('2d')

		// background
		ctx.drawImage(image, 0, 0, WIDTH, HEIGHT)

		// avatar
		ctx.drawImage(avatar, 22, 16, 64, 64)

		ctx.drawImage(overlay, 0, 0, WIDTH, HEIGHT)

		// text
		ctx.fillStyle = '#E8E8E8'
		ctx.font = '45px Bebas Neue'
		ctx.textAlign = 'center'
		ctx.lineWidth = 3
		ctx.strokeStyle = '#161616'
		ctx.strokeText(`LVL ${level}`, WIDTH / 2, 120)
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
    bmLimit)
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
        0, 5, 5, 0, 0, NOW(), 0, 0, 0, 0, 0, 0
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

class Monsters {
	constructor(app) {
		this.app = app
		this.mobdata = app.mobdata
	}

	async initSpawn(channelId) {
		const activeMob = await this.app.mysql.select('spawns', 'channelId', channelId)
		if (activeMob && this.mobdata[activeMob.monster]) {
			return false
		}
		else if (activeMob) {
			// monster was removed from mobdata, need to restart the spawning process
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])
			await this.app.cd.clearCD(channelId, 'mob')
			await this.app.cd.clearCD(channelId, 'mobHalf')
		}
		const rand = Math.round(Math.random() * (14400 * 1000)) + (28800 * 1000) // Generate random time from 8 - 12 hours
		console.log(`[MONSTERS] Counting down from ${this.app.cd.convertTime(rand)}`)

		this.app.cd.setCD(channelId, 'spawnCD', rand, { ignoreQuery: true }, () => {
			this.spawnMob(channelId, Object.keys(this.mobdata)[Math.floor(Math.random() * Object.keys(this.mobdata).length)])
		})
	}

	async spawnMob(channelId, monster) {
		try {
			const spawnInfo = await this.app.mysql.select('spawnChannels', 'channelId', channelId)
			if (!spawnInfo) throw new Error('No spawn channel.')

			if (!await this.app.patreonHandler.isPatron(spawnInfo.userId) && !this.app.sets.adminUsers.has(spawnInfo.userId)) throw new Error('User is not a patron.')

			const randMoney = Math.floor(Math.random() * (this.mobdata[monster].maxMoney - this.mobdata[monster].minMoney + 1)) + this.mobdata[monster].minMoney

			await this.app.query('INSERT INTO spawns (channelId, guildId, start, monster, health, money, bleed, burn) VALUES (?, ?, ?, ?, ?, ?, 0, 0)', [channelId, spawnInfo.guildId, Date.now(), monster, this.mobdata[monster].health, randMoney])

			await this.app.cd.setCD(channelId, 'mob', this.mobdata[monster].staysFor.seconds * 1000, undefined, () => {
				this.onFinished(channelId)
			})
			await this.app.cd.setCD(channelId, 'mobHalf', Math.floor(this.mobdata[monster].staysFor.seconds * 0.5) * 1000, undefined, () => {
				this.onHalf(channelId)
			})

			const mobEmbed = await this.genMobEmbed(channelId, this.mobdata[monster], this.mobdata[monster].health, randMoney)

			await this.app.bot.createMessage(channelId, { content: 'An enemy has spawned...', embed: mobEmbed.embed })
		}
		catch (err) {
			await this.app.query('DELETE FROM spawnChannels WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])
			await this.app.cd.clearCD(channelId, 'mob')
			await this.app.cd.clearCD(channelId, 'mobHalf')
			console.log(err)
		}
	}

	async genMobEmbed(channelId, monster, health, money) {
		const spawnInfo = await this.app.mysql.select('spawns', 'channelId', channelId)
		const remaining = await this.app.cd.getCD(channelId, 'mob')


		const guildPrefix = await this.app.common.getPrefix(spawnInfo.guildId)

		const loot = []

		for (const rate of Object.keys(monster.loot.main)) {
			for (const item of monster.loot.main[rate].items) {
				loot.push(item)
			}
		}
		for (const rate of Object.keys(monster.loot.extras)) {
			for (const item of monster.loot.extras[rate].items) {
				loot.push(item)
			}
		}

		let healthStr = `**${health} / ${monster.health}** HP${this.app.player.getHealthIcon(health, monster.health, true)}`

		if (spawnInfo.bleed > 0) {
			healthStr += `\n🩸 Bleeding: **${spawnInfo.bleed}**`
		}
		if (spawnInfo.burn > 0) {
			healthStr += `\n🔥 Burning: **${spawnInfo.burn}**`
		}

		const mobEmbed = new this.app.Embed()
			.setTitle(monster.title)
			.setDescription(`Attack with \`${guildPrefix}use <weapon> ${monster.title.toLowerCase()}\`\n\nYou have \`${remaining}\` to defeat ${monster.mentioned} before ${monster.pronoun} leaves the server.${monster.special !== '' ? `\n\n**Special:** ${monster.special}` : ''}`)
			.setColor(13451564)
			.addField('Health', healthStr, true)
			.addField('Damage', `${monster.weapon.icon}\`${monster.weapon.name}\` ${monster.minDamage} - ${monster.maxDamage}`, true)
			.addBlankField()
			.addField('Has a chance of dropping:', this.app.itm.getDisplay(loot.sort(this.app.itm.sortItemsHighLow.bind(this.app))).join('\n'), true)
			.addField('Balance', this.app.common.formatNumber(money), true)
			.setImage(monster.image)

		return mobEmbed
	}

	mobLeftEmbed(monster) {
		const mobEmbed = new this.app.Embed()
			.setTitle(`${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} left...`)
			.setDescription(`Nobody defeated ${monster.mentioned}!`)
			.setColor(13451564)
			.setImage(monster.leftImage)

		return mobEmbed
	}

	async onFinished(channelId, left = true) {
		try {
			const monsterStats = await this.app.mysql.select('spawns', 'channelId', channelId)
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])

			if (left) await this.app.bot.createMessage(channelId, this.mobLeftEmbed(this.mobdata[monsterStats.monster]))

			this.initSpawn(channelId)
		}
		catch (err) {
			await this.app.query('DELETE FROM spawnChannels WHERE channelId = ?', [channelId])
		}
	}

	async onHalf(channelId) {
		try {
			const monsterStats = await this.app.mysql.select('spawns', 'channelId', channelId)
			const embed = await this.genMobEmbed(channelId, this.mobdata[monsterStats.monster], monsterStats.health, monsterStats.money)
			embed.setTitle(`${this.mobdata[monsterStats.monster].title} - Only half the time remains!`)

			await this.app.bot.createMessage(channelId, embed)
		}
		catch (err) {
			console.log(err)
			await this.app.cd.clearCD(channelId, 'mob')
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawnChannels WHERE channelId = ?', [channelId])
		}
	}

	pickRandomLoot(monster, type, weightedArray) {
		const rand = weightedArray[Math.floor(Math.random() * weightedArray.length)]
		const rewards = monster.loot[type][rand].items

		return rewards[Math.floor(Math.random() * rewards.length)]
	}

	async subHealth(channelId, amount) {
		await this.app.query('UPDATE spawns SET health = health - ? WHERE channelId = ?', [amount, channelId])
	}

	async subMoney(channelId, amount) {
		await this.app.query('UPDATE spawns SET money = money - ? WHERE channelId = ?', [amount, channelId])
	}

	async addBurn(channelId, amount) {
		await this.app.query('UPDATE spawns SET burn = burn + ? WHERE channelId = ?', [amount, channelId])
	}

	async addBleed(channelId, amount) {
		await this.app.query('UPDATE spawns SET bleed = bleed + ? WHERE channelId = ?', [amount, channelId])
	}
}

module.exports = Monsters

class Monsters {
	constructor (app) {
		this.app = app
		this.mobdata = app.mobdata
	}

	async initSpawn (channelId) {
		const activeMob = await this.app.mysql.select('spawns', 'channelId', channelId)
		if (activeMob && this.mobdata[activeMob.monster]) {
			return false
		}
		else if (activeMob) {
			// monster was removed from mobdata, need to restart the spawning process
			await this.app.query('DELETE FROM spawnsdamage WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])
			await this.app.cd.clearCD(channelId, 'mob')
			await this.app.cd.clearCD(channelId, 'mobHalf')
		}
		const rand = Math.round(Math.random() * (14400 * 1000)) + (14400 * 1000) // Generate random time from 4 - 8 hours
		console.log(`[MONSTERS] Counting down from ${this.app.cd.convertTime(rand)}`)

		this.app.cd.setCD(channelId, 'spawnCD', rand, { ignoreQuery: true }, () => {
			this.spawnMob(channelId, Object.keys(this.mobdata)[Math.floor(Math.random() * Object.keys(this.mobdata).length)])
		})
	}

	async spawnMob (channelId, monster) {
		try {
			const spawnInfo = await this.app.mysql.select('spawnchannels', 'channelId', channelId)
			if (!spawnInfo) throw new Error('No spawn channel.')

			// if (!await this.app.patreonHandler.isPatron(spawnInfo.userId) && !this.app.sets.adminUsers.has(spawnInfo.userId)) throw new Error('User is not a patron.')

			const randMoney = Math.floor(Math.random() * (this.mobdata[monster].maxMoney - this.mobdata[monster].minMoney + 1)) + this.mobdata[monster].minMoney

			await this.app.query('INSERT INTO spawns (channelId, guildId, start, monster, health, money, bleed, burn) VALUES (?, ?, ?, ?, ?, ?, 0, 0)', [channelId, spawnInfo.guildId, Date.now(), monster, this.mobdata[monster].health, randMoney])

			await this.app.cd.setCD(channelId, 'mob', this.mobdata[monster].staysFor.seconds * 1000, undefined, () => {
				this.onFinished(channelId)
			})
			await this.app.cd.setCD(channelId, 'mobHalf', Math.floor(this.mobdata[monster].staysFor.seconds * 0.5) * 1000, undefined, () => {
				this.onHalf(channelId, spawnInfo.spawnPingRole)
			})

			const mobEmbed = await this.genMobEmbed(channelId, this.mobdata[monster], this.mobdata[monster].health, randMoney)

			await this.app.bot.createMessage(channelId, {
				content: spawnInfo.spawnPingRole ? `<@&${spawnInfo.spawnPingRole}>, An enemy has spawned...` : 'An enemy has spawned...',
				embed: mobEmbed.embed
			})
		}
		catch (err) {
			await this.app.query('DELETE FROM spawnsdamage WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawnchannels WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])
			await this.app.cd.clearCD(channelId, 'mob')
			await this.app.cd.clearCD(channelId, 'mobHalf')
			console.log(err)
		}
	}

	async genMobEmbed (channelId, monster, health, money) {
		const spawnInfo = await this.app.mysql.select('spawns', 'channelId', channelId)
		const remaining = await this.app.cd.getCD(channelId, 'mob')
		const topDamageDealers = await this.getTopDamageDealt(channelId)

		const guildPrefix = await this.app.common.getPrefix(spawnInfo.guildId)

		const mainLoot = Object.keys(monster.loot.main).reduce((arr, curr) => {
			arr.push(...monster.loot.main[curr].items)
			return arr
		}, [])
		const extraLoot = Object.keys(monster.loot.extras).reduce((arr, curr) => {
			arr.push(...monster.loot.extras[curr].items)
			return arr
		}, [])

		let healthStr = `**${health} / ${monster.health}** HP\n${this.app.player.getHealthIcon(health, monster.health)}`
		let topDamageStr = `Nobody has attacked ${monster.mentioned} yet.\nThe top **3** damage dealers will receive loot!`

		if (spawnInfo.bleed > 0) {
			healthStr += `\n🩸 Bleeding: **${spawnInfo.bleed}**`
		}
		if (spawnInfo.burn > 0) {
			healthStr += `\n🔥 Burning: **${spawnInfo.burn}**`
		}

		if (topDamageDealers.length) {
			topDamageStr = `${topDamageDealers.map((user, i) => `${i + 1}. <@${user.userId}> - **${user.damage}** damage`).join('\n')}\nThe top **3** damage dealers will receive loot!`
		}

		const mobEmbed = new this.app.Embed()
			.setTitle(monster.title)
			.setDescription(`Attack with \`${guildPrefix}use <weapon> ${monster.title.toLowerCase()}\`\n\nYou have \`${remaining}\` to defeat ${monster.mentioned} before ${monster.pronoun} leaves the server.${monster.special !== '' ? `\n\n**Special:** ${monster.special}` : ''}`)
			.setColor(13451564)
			.addField('Health', healthStr, true)
			.addField('Balance', this.app.common.formatNumber(money), true)
			.addField('Damage', `${monster.weapon.icon}\`${monster.weapon.name}\` ${monster.minDamage} - ${monster.maxDamage}`, true)
			.addBlankField()
			.addField('Top Damage Dealers', topDamageStr)
			.addField('Main Loot Drops:', this.app.itm.getDisplay(mainLoot.sort(this.app.itm.sortItemsHighLow.bind(this.app))).join('\n'), true)
			.addField('Extra Loot Drops:', this.app.itm.getDisplay(extraLoot.sort(this.app.itm.sortItemsHighLow.bind(this.app))).join('\n'), true)
			.setFooter(`https://lootcord.com/enemy/${spawnInfo.monster}`)
			.setImage(monster.image)

		return mobEmbed
	}

	async playerDealtDamage (userId, channelId, damage) {
		await this.app.query('INSERT INTO spawnsdamage (userId, channelId, damage) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE damage = damage + ?',
			[userId, channelId, damage, damage])
	}

	async getTopDamageDealt (channelId, limit = 3) {
		return this.app.query('SELECT * FROM spawnsdamage WHERE channelId = ? ORDER BY damage DESC LIMIT ?', [channelId, limit])
	}

	mobLeftEmbed (monster) {
		const mobEmbed = new this.app.Embed()
			.setTitle(`${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} left...`)
			.setDescription(`Nobody defeated ${monster.mentioned}!`)
			.setColor(13451564)
			.setImage(monster.leftImage)

		return mobEmbed
	}

	async onFinished (channelId, left = true) {
		try {
			const monsterStats = await this.app.mysql.select('spawns', 'channelId', channelId)
			await this.app.query('DELETE FROM spawnsdamage WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])

			if (left) await this.app.bot.createMessage(channelId, this.mobLeftEmbed(this.mobdata[monsterStats.monster]))

			this.initSpawn(channelId)
		}
		catch (err) {
			await this.app.query('DELETE FROM spawnchannels WHERE channelId = ?', [channelId])
		}
	}

	async onHalf (channelId, spawnPingRole) {
		try {
			const monsterStats = await this.app.mysql.select('spawns', 'channelId', channelId)
			const mobEmbed = await this.genMobEmbed(channelId, this.mobdata[monsterStats.monster], monsterStats.health, monsterStats.money)
			mobEmbed.setTitle(`${this.mobdata[monsterStats.monster].title} - Only half the time remains!`)

			await this.app.bot.createMessage(channelId, {
				content: spawnPingRole ? `<@&${spawnPingRole}>` : undefined,
				embed: mobEmbed.embed
			})
		}
		catch (err) {
			console.log(err)
			await this.app.cd.clearCD(channelId, 'mob')
			await this.app.query('DELETE FROM spawnsdamage WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawns WHERE channelId = ?', [channelId])
			await this.app.query('DELETE FROM spawnchannels WHERE channelId = ?', [channelId])
		}
	}

	pickRandomLoot (monster, type, weightedArray) {
		const rand = weightedArray[Math.floor(Math.random() * weightedArray.length)]
		const rewards = monster.loot[type][rand].items

		return rewards[Math.floor(Math.random() * rewards.length)]
	}

	async disperseRewards (channelId, monster, money, serverSideGuildId) {
		const topDamageDealers = await this.getTopDamageDealt(channelId)
		const weightedMain = this.app.itm.generateWeightedArray(monster.loot.main)
		const weightedExtras = this.app.itm.generateWeightedArray(monster.loot.extras)
		const rewardsArr = []
		const moneyReward = Math.floor(money / topDamageDealers.length)

		for (let i = 0; i < topDamageDealers.length; i++) {
			let loot

			if (i === 0) {
				loot = [this.pickRandomLoot(monster, 'main', weightedMain), this.pickRandomLoot(monster, 'extras', weightedExtras)]
				await this.app.player.addPoints(topDamageDealers[i].userId, monster.xp, serverSideGuildId)

				rewardsArr.push(`**${topDamageDealers[i].damage}** damage - <@${topDamageDealers[i].userId}>,\n${this.app.common.formatNumber(moneyReward)}\n${this.app.itm.getDisplay(loot).join('\n')}\n...and \`⭐ ${monster.xp} XP\`!`)
			}
			else if (i === 1) {
				loot = [this.pickRandomLoot(monster, 'main', weightedMain), this.pickRandomLoot(monster, 'extras', weightedExtras)]

				rewardsArr.push(`**${topDamageDealers[i].damage}** damage - <@${topDamageDealers[i].userId}>,\n${this.app.common.formatNumber(moneyReward)}\n${this.app.itm.getDisplay(loot).join('\n')}`)
			}
			else {
				loot = [this.pickRandomLoot(monster, 'extras', weightedExtras)]

				rewardsArr.push(`**${topDamageDealers[i].damage}** damage - <@${topDamageDealers[i].userId}>,\n${this.app.common.formatNumber(moneyReward)}\n${this.app.itm.getDisplay(loot).join('\n')}`)
			}

			await this.app.player.addMoney(topDamageDealers[i].userId, moneyReward, serverSideGuildId)
			await this.app.itm.addItem(topDamageDealers[i].userId, loot, null, serverSideGuildId)
		}

		const killedReward = new this.app.Embed()
			.setTitle('Rewards')
			.setColor(7274496)
			.setDescription(rewardsArr.join('\n\n'))

		return killedReward
	}

	async subHealth (channelId, amount) {
		await this.app.query('UPDATE spawns SET health = health - ? WHERE channelId = ?', [amount, channelId])
	}

	async subMoney (channelId, amount) {
		await this.app.query('UPDATE spawns SET money = money - ? WHERE channelId = ?', [amount, channelId])
	}

	async addBurn (channelId, amount) {
		await this.app.query('UPDATE spawns SET burn = burn + ? WHERE channelId = ?', [amount, channelId])
	}

	async addBleed (channelId, amount) {
		await this.app.query('UPDATE spawns SET bleed = bleed + ? WHERE channelId = ?', [amount, channelId])
	}
}

module.exports = Monsters

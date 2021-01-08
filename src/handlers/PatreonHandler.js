class PatreonHandler {
	constructor(app) {
		this.app = app
	}

	async checkPatronLeft(member) {
		for (let i = 1; i <= 4; i++) {
			if (await this.app.cd.getCD(member.id, `patron${i}`)) {
				this.lostTier(member.id, i, `\`${member.id}\` left support server...`)

				const patronEmbed = new this.app.Embed()
					.setTitle('😦 uh oh...')
					.setDescription('Your patreon benefits won\'t work if you leave the support server!')
					.setColor('#f96854')
				this.app.common.messageUser(member.id, patronEmbed)
			}
		}
	}

	async addPatronItems(userId) {
		await this.app.itm.addItem(userId, 'patron', 1)
	}

	async removePatronItems(userId) {
		await this.app.query('DELETE FROM user_items WHERE userId = ? AND item = \'patron\'', [userId])
		await this.app.query('UPDATE scores SET banner = \'none\' WHERE userId = ? AND banner = \'patron\'', [userId])
	}

	async isPatron(user, minTier = 1) {
		const patron1CD = await this.app.cd.getCD(user, 'patron1')
		const patron2CD = await this.app.cd.getCD(user, 'patron2')
		const patron3CD = await this.app.cd.getCD(user, 'patron3')
		const patron4CD = await this.app.cd.getCD(user, 'patron4')

		if (minTier === 1 && (patron1CD || patron2CD || patron3CD || patron4CD)) return true
		else if (minTier === 2 && (patron2CD || patron3CD || patron4CD)) return true
		else if (minTier === 3 && (patron3CD || patron4CD)) return true
		else if (minTier === 4 && patron4CD) return true

		return false
	}

	async getPatrons(minTier) {
		const patronRows = await this.app.query('SELECT * FROM patrons WHERE tier >= ?', [minTier])

		const patrons = {}

		for (let i = 0; i < patronRows.length; i++) {
			try {
				const user = await this.app.common.fetchUser(patronRows[i].userId, { cacheIPC: false })

				patrons[`${user.username}#${user.discriminator}`] = {
					avatar: this.app.common.getAvatar(user),
					tier: patronRows[i].tier
				}
			}
			catch (err) {
				// continue
			}
		}

		return patrons
	}

	async removePatrons(supportGuild) {
		const members = supportGuild.members
		const patronRows = await this.app.query('SELECT * FROM patrons')

		const roles = {
			1: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier1Patreon)).map(member => member.id),
			2: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier2Patreon)).map(member => member.id),
			3: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier3Patreon)).map(member => member.id),
			4: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier4Patreon)).map(member => member.id)
		}

		for (const tier in roles) {
			for (let i = 0; i < patronRows.filter(row => row.tier.toString() === tier).length; i++) {
				if (!roles[tier].includes(patronRows[i].userId)) {
					this.lostTier(patronRows[i].userId, tier, `\`${patronRows[i].userId}\`'s tier ${tier} pledge was not renewed.`)
				}
			}
		}
	}

	async gainedTier(userId, tier) {
		const patreonLogEmbed = new this.app.Embed()
			.setTitle('New Patron!')
			.addField('User', `\`\`\`fix\n${userId}\`\`\``, true)
			.addField('Tier', `\`\`\`\nTier ${tier}\`\`\``, true)
			.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
			.setColor('#f96854')

		const patronEmbed = new this.app.Embed()
			.setTitle('😲 a donator!')
			.setDescription('Thank you for helping me create Lootcord!!\n\nYou can view your benefits with the `patreon` command!')
			.setFooter('💙 blobfysh')
			.setColor('#f96854')

		try {
			await this.app.query('INSERT INTO patrons (userId, tier, started) VALUES (?, ?, ?)', [userId, tier, Date.now()])
			await this.app.cache.setNoExpire(`patron${tier}|${userId}`, `Patron Monthly Tier ${tier}`)
			await this.addPatronItems(userId)

			if (parseInt(tier) >= 3) {
				await this.app.itm.addBadge(userId, 'loot_lord')
			}

			await this.app.common.messageUser(userId, patronEmbed, { throwErr: true })

			patreonLogEmbed.setFooter('✅ Success')
			this.app.messager.messageLogs(patreonLogEmbed)
		}
		catch (err) {
			patreonLogEmbed.addField('Error', `\`\`\`\n${err}\`\`\``)
			patreonLogEmbed.setFooter('❌ Failed to send message to user.')
			this.app.messager.messageLogs(patreonLogEmbed)
		}
	}

	async lostTier(userId, tier, msg = undefined) {
		try {
			await this.app.query('DELETE FROM patrons WHERE userId = ? AND tier = ?', [userId, tier])
			await this.app.cd.clearCD(userId, `patron${tier}`)
			await this.removePatronItems(userId)

			if (tier.toString() === '3') {
				await this.app.itm.removeBadge(userId, 'loot_lord')
			}

			const patreonLogEmbed = new this.app.Embed()
				.setTitle('Perks Ended')
				.setColor(16734296)
				.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
				.setDescription(msg)
			this.app.messager.messageLogs(patreonLogEmbed)
		}
		catch (err) {
			console.error(err)
		}
	}

	async refreshPatrons(supportGuild) {
		const members = supportGuild.members
		const patronRows = await this.app.query('SELECT * FROM patrons')

		const roles = {
			1: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier1Patreon)).map(member => member.id),
			2: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier2Patreon)).map(member => member.id),
			3: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier3Patreon)).map(member => member.id),
			4: members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier4Patreon)).map(member => member.id)
		}

		for (const tier in roles) {
			for (const userId of roles[tier]) {
				const patronage = patronRows.filter(patron => patron.userId === userId)
				const account = await this.app.player.getRow(userId)

				if (!account) {
					continue
				}

				// checks if user is already listed as patron in database and makes sure they don't have a role for a higher tier.
				// checking if the user has a higher tier role prevents issues when user has multiple patron roles like tier 1 and tier 2
				if (patronage.length && patronage[0].tier.toString() !== tier && !Object.keys(roles).some(t => t > tier && roles[t].includes(userId))) {
					await this.lostTier(userId, patronage[0].tier, `\`${userId}\` patron switched from tier ${patronage[0].tier} to tier ${tier}`)
					this.gainedTier(userId, tier)
				}
				else if (!patronage.length) {
					this.gainedTier(userId, tier)
				}
			}
		}
	}
}

module.exports = PatreonHandler

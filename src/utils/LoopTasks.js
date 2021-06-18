const CronJob = require('cron').CronJob
const salesData = require('../resources/json/sales')
const STATUS_LIST = [
	'Looting {users} players',
	'{users} loot goblins',
	'{guilds} servers!',
	'Join the discord!',
	'lootcord.com 👀'
]

class LoopTasks {
	constructor (app) {
		this.app = app
		this.daily = new CronJob('0 0 0 * * *', this.dailyTasks.bind(this), null, false, 'America/New_York')
		this.refreshLBJob = new CronJob('0 */6 * * *', this.refreshLB.bind(this), null, false, 'America/New_York')
		this.biHourly = new CronJob('0 */2 * * *', this.biHourlyTasks.bind(this), null, false, 'America/New_York')
		this.hourly = new CronJob('0 * * * *', this.hourlyTasks.bind(this), null, false, 'America/New_York')
		this.removePatrons = new CronJob('0 0 2 * *', () => { this.app.ipc.broadcast('removePatrons', {}) }, null, false, 'America/New_York')
		this.firstOfMonth = new CronJob('0 0 1 * *', this.monthlyTasks.bind(this), null, false, 'America/New_York')
		this.weekly = new CronJob('0 0 * * 0', this.weeklyTasks.bind(this), null, false, 'America/New_York')

		// every 3 minutes
		this.often = new CronJob('*/3 * * * *', this.frequentTasks.bind(this), null, false, 'America/New_York')

		// every 5 minutes
		this.bleed = new CronJob('*/5 * * * *', this.bleedTask.bind(this), null, false, 'America/New_York')
	}

	start () {
		if (this.app.clusterID === 0) {
			console.log('[LOOPTASKS] Starting daily/bi-hourly tasks...')
			this.daily.start()
			this.refreshLBJob.start()
			this.biHourly.start()
			this.often.start()
			this.bleed.start()
			this.removePatrons.start()
			this.firstOfMonth.start()
			this.weekly.start()
		}

		this.hourly.start()
	}

	async monthlyTasks () {
		await this.app.query('UPDATE scores SET points = 0, level = 1')
	}

	async dailyTasks () {
		console.log('[LOOPTASKS] Running daily tasks...')

		// remove upkeep from global clans
		await this._takeClansUpkeep(false)

		// remove upkeep from server-side clans
		await this._takeClansUpkeep(true)

		// remove old logs
		await this.app.query('DELETE FROM clan_logs WHERE logDate < NOW() - INTERVAL 30 DAY')

		// remove old transactions
		await this.app.query('DELETE FROM transactions WHERE date < NOW() - INTERVAL 30 DAY')
		await this.app.query('DELETE FROM blackmarket_transactions WHERE soldDate < NOW() - INTERVAL 60 DAY')

		// reset daily limits
		await this.app.query('UPDATE scores SET discoinLimit = 0, bmLimit = 0 WHERE discoinLimit != 0 OR bmLimit != 0')

		// auto-deactivate players who have not played for 7 days
		const globalInactiveUsers = await this.app.query(`SELECT scores.userId, userguilds.guildId, lastActive
			FROM userguilds
			INNER JOIN scores
			ON userguilds.userId = scores.userId
			INNER JOIN guildinfo
			ON userguilds.guildId = guildinfo.guildId
			WHERE scores.lastActive < NOW() - INTERVAL 7 DAY AND serverOnly = 0`)
		const serverSideInactiveUsers = await this.app.query(`SELECT server_scores.userId, userguilds.guildId, lastActive
			FROM userguilds
			INNER JOIN server_scores
			ON userguilds.userId = server_scores.userId
			INNER JOIN guildinfo
			ON userguilds.guildId = guildinfo.guildId
			WHERE server_scores.lastActive < NOW() - INTERVAL 7 DAY AND serverOnly = 1 AND server_scores.guildId = guildinfo.guildId`)
		let activeRolesRemoved = 0

		for (const inactiveUser of globalInactiveUsers) {
			if (Object.keys(this.app.config.activeRoleGuilds).includes(inactiveUser.guildId)) {
				this.app.ipc.broadcast('removeActiveRole', {
					guildId: inactiveUser.guildId,
					userId: inactiveUser.userId,
					roleId: this.app.config.activeRoleGuilds[inactiveUser.guildId].activeRoleID
				})

				activeRolesRemoved++
			}
		}
		// remove role from server-side users
		for (const inactiveUser of serverSideInactiveUsers) {
			if (Object.keys(this.app.config.activeRoleGuilds).includes(inactiveUser.guildId)) {
				this.app.ipc.broadcast('removeActiveRole', {
					guildId: inactiveUser.guildId,
					userId: inactiveUser.userId,
					roleId: this.app.config.activeRoleGuilds[inactiveUser.guildId].activeRoleID
				})

				activeRolesRemoved++
			}
		}

		console.log(`[LOOPTASKS] Removed active role from ${activeRolesRemoved} players.`)

		await this.app.query(`DELETE FROM userguilds
			USING userguilds
			INNER JOIN scores
			ON userguilds.userId = scores.userId
			INNER JOIN guildinfo
			ON userguilds.guildId = guildinfo.guildId
			WHERE scores.lastActive < NOW() - INTERVAL 7 DAY AND serverOnly = 0`)
		await this.app.query(`DELETE FROM userguilds
			USING userguilds
			INNER JOIN server_scores
			ON userguilds.userId = server_scores.userId
			INNER JOIN guildinfo
			ON userguilds.guildId = guildinfo.guildId
			WHERE server_scores.lastActive < NOW() - INTERVAL 7 DAY AND serverOnly = 1 AND server_scores.guildId = guildinfo.guildId`)
	}

	async restockShop () {
		await this.app.query('DELETE FROM sales')

		const items = this.app.common.shuffleArr(salesData).slice(0, 2)
		const deals = []

		for (const item of items) {
			// 20 - 30% off
			const percentOff = Math.floor((Math.random() * (30 - 20 + 1)) + 20)
			let price

			if (this.app.itemdata[item].buy.currency) {
				price = Math.floor(this.app.itemdata[item].buy.amount * (1 - (percentOff / 100)))
			}
			else {
				// item can't normally be bought, multiply sell price by 15 and apply percent off
				price = Math.floor(this.app.itemdata[item].sell * 15 * (1 - (percentOff / 100)))
			}

			deals.push({
				item,
				price
			})

			await this.app.query('INSERT INTO sales (item, price) VALUES (?, ?)', [item, price])
		}

		if (this.app.config.scrapDealsChannel) {
			try {
				const dealsEmbed = new this.app.Embed()
					.setTitle('Scrap Deals')
					.setDescription(deals.map(deal => `${this.app.itemdata[deal.item].icon}\`${deal.item}\`\n` +
						`Price: ${this.app.itemdata[deal.item].buy.currency ? `~~${this.app.common.formatNumber(this.app.itemdata[deal.item].buy.amount, true)}~~ ` : ''}${this.app.common.formatNumber(deal.price)}`).join('\n\n'))
					.setColor(13451564)
					.setFooter('These deals will last 2 hours.')

				const botMessage = await this.app.bot.createMessage(this.app.config.scrapDealsChannel, dealsEmbed)

				await botMessage.crosspost()
			}
			catch (err) {
				console.warn('Error crossposting scrap deals message:')
				console.warn(err)
			}
		}
	}

	async refreshLB () {
		console.log('[LOOPTASKS] Refreshing global leaderboard...')
		const leaders = await this.app.leaderboard.getLB()
		const patrons = await this.app.patreonHandler.getPatrons(2)
		this.app.cache.setNoExpire('leaderboard', JSON.stringify(leaders))
		this.app.cache.setNoExpire('patronsCache', JSON.stringify(patrons))
	}

	async biHourlyTasks () {
		console.log('[LOOPTASKS] Running bi-hourly tasks...')
		// reroll scrap deals in shop
		await this.restockShop()

		// add 5 health to clans every 2 hours
		await this.app.query('UPDATE clans SET health = health + 5 WHERE health < maxHealth')
		await this.app.query('UPDATE server_clans SET health = health + 5 WHERE health < maxHealth')

		// clean up cooldown tables
		await this.app.query('DELETE FROM cooldown WHERE UNIX_TIMESTAMP() * 1000 > start + length')
		await this.app.query('DELETE FROM server_cooldown WHERE UNIX_TIMESTAMP() * 1000 > start + length')
	}

	async hourlyTasks () {
		const stats = JSON.parse(await this.app.cache.get('stats')) || {}

		if (this.app.bot.shards.get([...this.app.bot.shards][0][0]).presence.game.type === 2) return

		if (stats.guilds) {
			this.app.bot.editStatus('online', {
				name: `t-help | ${STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)].replace('{users}', this.app.common.formatNumber(stats.users, true)).replace('{guilds}', this.app.common.formatNumber(stats.guilds, true))}`,
				type: 0
			})
		}
	}

	async weeklyTasks () {
		console.log('[LOOPTASKS] Running weekly tasks...')
		// remove all bounties and reimburse players
		const bounties = await this.app.query('SELECT * FROM bounties')
		await this.app.bountyHandler.reimburseAll()

		// combine all bounties user has placed
		const userBounties = bounties.reduce((obj, curr) => {
			obj[curr.placedBy] = obj[curr.placedBy] ?
				{
					money: curr.money + obj[curr.placedBy].money,
					bounties: [...obj[curr.placedBy].bounties, {
						id: curr.userId,
						money: curr.money
					}]
				} :
				{
					money: curr.money,
					bounties: [{
						id: curr.userId,
						money: curr.money
					}]
				}

			return obj
		}, {})

		for (const user in userBounties) {
			const bountyList = []

			for (const bountyId of userBounties[user].bounties) {
				const bountyUser = await this.app.common.fetchUser(bountyId.id, { cacheIPC: false })

				bountyList.push(`${bountyUser.username}#${bountyUser.discriminator} - ${this.app.common.formatNumber(bountyId.money)}`)
			}

			const bountyEmbed = new this.app.Embed()
				.setColor(13451564)
				.setDescription(`**${this.app.icons.death_skull} The following bounties you placed have expired:**\n\n${bountyList.join('\n')}\n\n**You have been reimbursed ${this.app.common.formatNumber(userBounties[user].money)}.**`)

			this.app.common.messageUser(user, bountyEmbed)
		}
	}

	async frequentTasks () {
		if (!this.app.config.debug && this.app.clusterID === 0) {
			await this._handleDiscoinTransactions()
		}

		await this.app.ipc.broadcast('refreshPatrons', {})
	}

	async bleedTask () {
		await this.app.query(`UPDATE scores SET health = CASE
			WHEN bleed >= 5 AND burn >= 3 AND health > 8 THEN health - 8
			WHEN bleed >= 5 AND burn >= 3 THEN 1
			WHEN bleed < 5 AND burn < 3 AND health > (bleed + burn) THEN health - (bleed + burn)
			WHEN bleed < 5 AND health > (bleed + 3) THEN health - (bleed + 3)
			WHEN burn < 3 AND health > (5 + burn) THEN health - (5 + burn)
			ELSE 1
		END,
		bleed = CASE
			WHEN bleed >= 5 THEN bleed - 5
			ELSE 0
		END,
		burn = CASE
			WHEN burn >= 3 THEN burn - 3
			ELSE 0
		END
		WHERE bleed > 0 OR burn > 0`)

		await this.app.query(`UPDATE server_scores SET health = CASE
			WHEN bleed >= 5 AND burn >= 3 AND health > 8 THEN health - 8
			WHEN bleed >= 5 AND burn >= 3 THEN 1
			WHEN bleed < 5 AND burn < 3 AND health > (bleed + burn) THEN health - (bleed + burn)
			WHEN bleed < 5 AND health > (bleed + 3) THEN health - (bleed + 3)
			WHEN burn < 3 AND health > (5 + burn) THEN health - (5 + burn)
			ELSE 1
		END,
		bleed = CASE
			WHEN bleed >= 5 THEN bleed - 5
			ELSE 0
		END,
		burn = CASE
			WHEN burn >= 3 THEN burn - 3
			ELSE 0
		END
		WHERE bleed > 0 OR burn > 0`)

		await this.app.query(`UPDATE spawns SET health = CASE
			WHEN bleed >= 5 AND burn >= 3 AND health > 8 THEN health - 8
			WHEN bleed >= 5 AND burn >= 3 THEN 1
			WHEN bleed < 5 AND burn < 3 AND health > (bleed + burn) THEN health - (bleed + burn)
			WHEN bleed < 5 AND health > (bleed + 3) THEN health - (bleed + 3)
			WHEN burn < 3 AND health > (5 + burn) THEN health - (5 + burn)
			ELSE 1
		END,
		bleed = CASE
			WHEN bleed >= 5 THEN bleed - 5
			ELSE 0
		END,
		burn = CASE
			WHEN burn >= 3 THEN burn - 3
			ELSE 0
		END
		WHERE bleed > 0 OR burn > 0`)
	}

	async _takeClansUpkeep (serverSide = false) {
		try {
			const transaction = await this.app.mysql.beginTransaction()
			let moneyRemoved = 0
			let itemsRemoved = 0
			let decayingClans = 0

			if (!serverSide) {
				const globalClans = await transaction.query('SELECT clanId, money, level FROM clans FOR UPDATE')

				for (const clan of globalClans) {
					const clanItems = await this.app.clans.getItemObjectForUpdate(transaction.query, clan.clanId)
					const { itemCount } = this.app.itm.getUserItems(clanItems)
					const upkeep = this.app.clans.getUpkeep(clan.level)

					if (clan.money >= upkeep) {
						await this.app.clans.removeMoneySafely(transaction.query, clan.clanId, upkeep)
						moneyRemoved += upkeep
						decayingClans++
					}
					else if (itemCount >= 1) {
						const randomItem = await this.app.itm.getRandomUserItems(clanItems, 1)
						await this.app.clans.removeItemSafely(transaction.query, clan.clanId, randomItem.items[0], 1)
						await this.app.clans.addLog(clan.clanId, `The item storage lost 1x ${randomItem.items[0]} due to cost of upkeep`)
						itemsRemoved++
						decayingClans++
					}
				}
			}
			else {
				const serverSideClans = await transaction.query('SELECT clanId, guildId, money, level FROM server_clans FOR UPDATE')

				for (const clan of serverSideClans) {
					const clanItems = await this.app.clans.getItemObjectForUpdate(transaction.query, clan.clanId, clan.guildId)
					const { itemCount } = this.app.itm.getUserItems(clanItems)
					const upkeep = this.app.clans.getUpkeep(clan.level)

					if (clan.money >= upkeep) {
						await this.app.clans.removeMoneySafely(transaction.query, clan.clanId, upkeep, clan.guildId)
						moneyRemoved += upkeep
						decayingClans++
					}
					else if (itemCount >= 1) {
						const randomItem = await this.app.itm.getRandomUserItems(clanItems, 1)
						await this.app.clans.removeItemSafely(transaction.query, clan.clanId, randomItem.items[0], 1, clan.guildId)
						await this.app.clans.addLog(clan.clanId, `The item storage lost 1x ${randomItem.items[0]} due to cost of upkeep`, clan.guildId)
						itemsRemoved++
						decayingClans++
					}
				}
			}

			await transaction.commit()

			const dailyEmbed = new this.app.Embed()
				.setTitle('Daily Tasks')
				.setDescription(`Removed ${this.app.common.formatNumber(moneyRemoved)} and **${itemsRemoved}** items from **${decayingClans}** decaying ${serverSide ? 'server-side' : 'global'} clans.`)
				.setColor('#ffffff')
			this.app.messager.messageLogs(dailyEmbed)
		}
		catch (err) {
			console.error(err)

			const errorEmbed = new this.app.Embed()
				.setTitle('Daily Tasks')
				.setDescription(`Error removing upkeep from ${serverSide ? 'server-side' : 'global'} clans:\n\`\`\`\n${err}\`\`\``)
				.setColor('#ffffff')
			this.app.messager.messageLogs(errorEmbed)
		}
	}

	async _handleDiscoinTransactions () {
		try {
			const unhandled = await this.app.discoin.getUnhandled()
			/* test transaction
            const unhandled = {
                data: [
                    {
                        "id":"8fd3e69d-c7d3-4a07-95bc-687f588a49c2",
                        "amount":"100",
                        "user":"168958344361541633",
                        "handled":false,
                        "timestamp":"2020-05-24T19:44:20.586Z",
                        "payout":950000,
                        "from":{
                            "id":"SPN",
                            "name":"Nova Supernova",
                            "value":0.187,
                            "reserve":"53547384.17"
                        },
                        "to":{
                            "id":"LCN",
                            "name":"Lootcord Lootcoin",
                            "value":0.8,
                            "reserve":"67719.17"
                        }
                    }
                ]
            }
            */
			const logTransactions = []

			for (let i = 0; i < unhandled.data.length; i++) {
				const transaction = unhandled.data[i]
				let payout = Math.round(transaction.payout)
				let refunded = 0
				let userRow = await this.app.player.getRow(transaction.user)
				await this.app.discoin.handle(transaction.id)

				if (!userRow) {
					// create account for user if they dont have one
					await this.app.player.createAccount(transaction.user)

					userRow = await this.app.player.getRow(transaction.user)
				}

				const embed = new this.app.Embed()
					.setTitle('Conversion Successful')
					.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png')
					.setDescription(`You received ${this.app.common.formatNumber(payout)} (${transaction.payout} rounded) through Discoin! [Click this to see more details.](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)\n\nKeep in mind there is a daily limit of ${this.app.common.formatNumber(100000)} on incoming transactions.`)
					.setColor(13451564)

				if (userRow.discoinLimit + payout > 100000) {
					if (userRow.discoinLimit >= 100000) {
						// user hit daily limit, refund everything
						refunded = payout
						payout = 0
					}
					else {
						refunded = Math.abs(100000 - (userRow.discoinLimit + payout))
						payout -= refunded
					}

					try {
						await this.app.discoin.request(transaction.user, refunded, transaction.from.id)
					}
					catch (err) {
						console.error(err)

						// idk discoin not working so just give them all money, this is very unlikely to happen tho since discoin.handle() would error before this
						refunded = 0
						payout = Math.round(transaction.payout)
					}

					embed.setDescription(`**Oh no!**\nIt looks like you hit the daily transaction limit of **${this.app.common.formatNumber(100000)}**\n\nYou still received **${this.app.common.formatNumber(payout)}**, the other **${this.app.common.formatNumber(refunded)}** was automatically sent back to **${transaction.from.id}**.\n\nThis limit helps keep our economy stable!`)
				}

				await this.app.query('UPDATE scores SET discoinLimit = discoinLimit + ? WHERE userId = ?', [payout, transaction.user])
				this.app.player.addMoney(transaction.user, payout)
				this.app.common.messageUser(transaction.user, embed)

				const logEmbed = new this.app.Embed()
					.setTitle('Discoin Conversion')
					.setDescription(`${transaction.from.name}(${transaction.from.id}) to Scrap\n\n[Link](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)`)
					.addField('Scrap Payout', `${this.app.common.formatNumber(payout)} (${this.app.common.formatNumber(refunded)} refunded)`, true)
					.addField('User', `\`\`\`\n${transaction.user}\`\`\``)
					.setFooter(`Transaction ID: ${transaction.id}`)
					.setColor(13451564)

				logTransactions.push(logEmbed)
			}

			if (logTransactions.length) this.app.messager.messageLogs(logTransactions)
			console.log(`[DISCOIN] Successfully handled ${unhandled.data.length} transactions.`)
		}
		catch (err) {
			console.log('[DISCOIN] API error:')
			console.log(err)
		}
	}

	async _refreshBlacklist () {
		try {
			const list = await this.app.noflylist.getList()
			let totalBanned = 0

			for (let i = 0; i < list.length; i++) {
				if (await this.app.cd.getCD(list[i].discordId, 'banned')) continue
				const reason = `Automatically banned using the no fly list for reason: ${list[i].reason}`

				await this.app.query('INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)', [list[i].discordId, reason, new Date(list[i].dateBlacklisted).getTime()])
				await this.app.cache.setNoExpire(`banned|${list[i].discordId}`, 'Banned perma')

				console.log(`[LOOPTASKS] Banned user ${list[i].discordId} using no fly list.`)
				totalBanned++
			}

			return `Banned ${totalBanned} users using the no fly list.`
		}
		catch (err) {
			console.warn('Unable to refresh the global blacklist:')
			console.warn(err)
		}
	}
}

module.exports = LoopTasks

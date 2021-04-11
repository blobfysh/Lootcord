const monuments = require('../../resources/json/explorations')

module.exports = {
	name: 'exploration',
	cooldown: 3600 * 1000,

	async execute(app, message, { prefix }) {
		console.log('[EVENT] Exploration started')

		const collectorObj = app.msgCollector.createChannelCollector(message, m => m.channel.id === message.channel.id &&
            m.content.toLowerCase() === 'roam', { time: 40000 })

		const monumentsArr = Object.keys(monuments)
		const monument = monuments[monumentsArr[Math.floor(Math.random() * monumentsArr.length)]]
		const successRates = Object.keys(monument.successRate)

		const exploreEmbed = new app.Embed()
			.setColor(13451564)
			.setTitle('Event - __IT\'S TIME TO ROAM!__')
			.setDescription(`Monument: **${monument.title}**\nRecommended level: **${monument.suggestedLevel}+**\n\nType \`roam\` to explore this monument for loot!`)
			.setImage(monument.image)

		try {
			const startedMessage = await message.channel.createMessage(exploreEmbed)
			const joined = {}

			collectorObj.collector.on('collect', async m => {
				if (!await app.player.isActive(m.author.id, m.channel.guild.id)) return m.channel.createMessage(`Your account is not active in this server! Use \`${prefix}play\` to activate it here`)

				// ignore users who have already joined this event
				else if (Object.keys(joined).includes(m.author.id)) return

				// max 6 people per event (to prevent hitting the character limit)
				else if (Object.keys(joined).length >= 6) return

				joined[m.author.id] = m.author
				m.addReaction(app.icons.confirm)
			})

			collectorObj.collector.on('end', async reason => {
				exploreEmbed.setDescription(`Monument: **${monument.title}**\nRecommended level: **${monument.suggestedLevel}+**\n\n~~Type \`roam\` to explore this monument for loot!~~\n❌ This event has ended and is no longer accepting responses! ${app.icons.blackjack_dealer_lost}`)
				startedMessage.edit(exploreEmbed)

				const results = []

				for (const user in joined) {
					const userRow = await app.player.getRow(user)
					const userItems = await app.itm.getItemObject(user)
					const armor = await app.player.getArmor(user)
					let successRate = monument.successRate[userRow.level] !== undefined ? monument.successRate[userRow.level] : monument.successRate[successRates[successRates.length - 1]]

					// check for monument requirements such as items/armor
					if (monument.requirement.type !== null) {
						if (monument.requirement.type === 'armor' && armor && armor === monument.requirement.value) {
							successRate += monument.requirement.bonus
						}
						else if (monument.requirement.type === 'item' && userItems[monument.requirement.value] >= 1) {
							await app.itm.removeItem(user, monument.requirement.value, 1)

							successRate += monument.requirement.bonus
						}
						else {
							successRate -= 1
						}
					}

					if (Math.random() < successRate) {
						const outcome = monument.success[Math.floor(Math.random() * monument.success.length)]
						const rewardItem = Math.random() < 0.2 ? outcome.reward.rareItem.split('|') : outcome.reward.item.split('|')
						const itemCt = await app.itm.getItemCount(userItems, userRow)
						const hasEnough = await app.itm.hasSpace(itemCt, rewardItem[1])
						let quote = outcome.quote
						let rewardDisplay = ''

						if (outcome.loss.type === 'health') {
							let healthReduct = outcome.loss.value

							if (armor) {
								healthReduct -= Math.floor(outcome.loss.value * app.itemdata[armor].shieldInfo.protection)
							}

							if (userRow.health - healthReduct <= 0) {
								healthReduct = userRow.health - 1
							}

							await app.mysql.updateDecr('scores', 'health', healthReduct, 'userId', user)

							quote = quote.replace('{damage}', armor ? `💥~~${outcome.loss.value}~~ ${app.itemdata[armor].icon}${healthReduct}` : `💥${healthReduct}`)
						}

						if (hasEnough && Math.random() < 0.9) {
							await app.itm.addItem(user, rewardItem[0], rewardItem[1])

							rewardDisplay = `**${rewardItem[1]}x** ${app.itemdata[rewardItem[0]].icon}\`${rewardItem[0]}\``
						}
						else {
							const moneyMin = outcome.reward.money.min
							const moneyMax = outcome.reward.money.max
							const winnings = Math.floor((Math.random() * (moneyMax - moneyMin + 1)) + moneyMin)

							await app.player.addMoney(user, winnings)

							rewardDisplay = `**${app.common.formatNumber(winnings)}**`
						}

						results.push(app.icons.plus + quote.replace('{reward}', rewardDisplay).replace('{user}', `<@${user}>`).replace(/{user}/g, joined[user].username))
					}
					else {
						const outcome = monument.failed[Math.floor(Math.random() * monument.failed.length)]
						const item1 = app.itemdata[outcome.item] ? `${app.itemdata[outcome.item].icon}\`${outcome.item}\`` : ''
						const item2 = app.itemdata[outcome.item2] ? `${app.itemdata[outcome.item2].icon}\`${outcome.item2}\`` : ''
						let quote = outcome.quote.replace('{item}', item1).replace('{item2}', item2).replace('{user}', `<@${user}>`).replace(/{user}/g, joined[user].username)

						if (outcome.loss.type === 'health') {
							let healthReduct = outcome.loss.value

							if (armor) {
								healthReduct -= Math.floor(outcome.loss.value * app.itemdata[armor].shieldInfo.protection)

								quote = quote.replace('{damage}', `💥~~${outcome.loss.value}~~ ${app.itemdata[armor].icon}${healthReduct}`)
							}
							else {
								quote = quote.replace('{damage}', `💥${healthReduct}`)
							}

							if (userRow.health - healthReduct <= 0) {
								// player was killed
								const randomItems = await app.itm.getRandomUserItems(user, 2)
								const minSteal = Math.floor(userRow.money * 0.15)
								const maxSteal = Math.floor(userRow.money * 0.55)
								const moneyStolen = Math.floor((Math.random() * (maxSteal - minSteal + 1)) + minSteal)

								await app.itm.removeItem(user, randomItems.amounts)
								await app.player.removeMoney(user, moneyStolen)

								await app.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${user}`)
								await app.query(`UPDATE scores SET health = 100 WHERE userId = ${user}`)
								if (userRow.power >= -3) {
									await app.query(`UPDATE scores SET power = power - 2 WHERE userId = ${user}`)
								}
								else {
									await app.query(`UPDATE scores SET power = -5 WHERE userId = ${user}`)
								}

								if (randomItems.items.length) {
									quote += `\n${app.icons.death_skull} **${joined[user].username} DIED** and lost ${app.common.formatNumber(moneyStolen)}, ${randomItems.display.join(', ')}...`
								}
								else {
									quote += `\n${app.icons.death_skull} **${joined[user].username} DIED** and lost ${app.common.formatNumber(moneyStolen)}.`
								}
							}
							else {
								await app.mysql.updateDecr('scores', 'health', healthReduct, 'userId', user)

								if (outcome.loss.item) {
									const randomItem = await app.itm.getRandomUserItems(user, 1)

									if (randomItem.items.length) {
										await app.itm.removeItem(user, randomItem.amounts)

										quote += `\n${app.icons.minus} **${joined[user].username}** lost ${randomItem.display[0]} and now has ${app.icons.health.full} **${userRow.health - healthReduct}** health.`
									}
									else {
										quote += `\n${app.icons.minus} **${joined[user].username}** now has ${app.icons.health.full} **${userRow.health - healthReduct}** health.`
									}
								}
								else {
									quote += `\n${app.icons.minus} **${joined[user].username}** now has ${app.icons.health.full} **${userRow.health - healthReduct}** health.`
								}
							}
						}

						results.push(quote)
					}
				}

				if (results.length) {
					const resultsEmb = new app.Embed()
						.setColor(13451564)
						.setTitle('Event Results - __IT\'S TIME TO ROAM!__')
						.setDescription(results.join('\n\n'))

					await message.channel.createMessage(resultsEmb)
				}
			})
		}
		catch (err) {
			// kicked bot during exploration?
			console.warn(err)
		}
	}
}

module.exports = {
	name: 'elfattack',
	cooldown: 600 * 1000,

	async execute (app, message, { prefix, serverSideGuildId, eventPingRole }) {
		console.log('[EVENT] Christmas event started')

		const collectorObj = app.msgCollector.createChannelCollector(message.channel.id, m => m.content.toLowerCase() === 'slap elf', { time: 40000 })

		const exploreEmbed = new app.Embed()
			.setColor('#006008')
			.setTitle('Event - __ELF RAMPAGE__')
			.setDescription('**An angry 🧝 elf has escaped from Santa\'s workshop!**\n\nQuick, type `slap elf` to help Santa stop them from ruining christmas!\n\nThe more people that slap the elf, the higher the chance of success.')

		try {
			const startedMessage = await message.channel.createMessage({
				content: eventPingRole ? `<@&${eventPingRole}>` : undefined,
				embed: exploreEmbed.embed,
				allowedMentions: {
					everyone: false,
					roles: true,
					users: true
				}
			})
			const joined = {}

			collectorObj.collector.on('collect', async m => {
				if (!await app.player.isActive(m.author.id, m.channel.guild.id)) return m.channel.createMessage(`Your account is not active in this server! Use \`${prefix}play\` to activate it here`)

				// ignore users who have already joined this event
				else if (Object.keys(joined).includes(m.author.id)) return

				// max 8 people per event
				else if (Object.keys(joined).length >= 8) return

				joined[m.author.id] = m.author
				m.addReaction(app.icons.confirm)
			})

			collectorObj.collector.on('end', async reason => {
				exploreEmbed.setDescription(`~~**An angry 🧝 elf has escaped from Santa's workshop!**\n\nQuick, type \`slap elf\` to help Santa stop them from ruining christmas!\n\nThe more people that slap the elf, the higher the chance of success.~~\n❌ This event has ended and is no longer accepting responses! ${app.icons.blackjack_dealer_lost}`)
				startedMessage.edit(exploreEmbed)

				const results = []
				const wasSuccessful = Math.random() < Object.keys(joined).length / 4

				for (const user in joined) {
					const userRow = await app.player.getRow(user, serverSideGuildId)
					const userItems = await app.itm.getItemObject(user, serverSideGuildId)
					let quote = ''

					if (wasSuccessful) {
						const itemCt = await app.itm.getItemCount(userItems, userRow)
						const hasEnough = await app.itm.hasSpace(itemCt, 1)

						if (hasEnough && Math.random() < 0.07) {
							await app.itm.addItem(user, 'medium_present', 1, serverSideGuildId)

							quote = `<@${user}> received **1x** ${app.itemdata.medium_present.icon}\`medium_present\`.`
						}
						else if (hasEnough) {
							await app.itm.addItem(user, 'small_present', 1, serverSideGuildId)

							quote = `<@${user}> received **1x** ${app.itemdata.small_present.icon}\`small_present\`.`
						}
						else {
							const moneyMin = 1000
							const moneyMax = 2000
							const winnings = Math.floor((Math.random() * (moneyMax - moneyMin + 1)) + moneyMin)

							await app.player.addMoney(user, winnings, serverSideGuildId)

							quote = `<@${user}> received **${app.common.formatNumber(winnings)}**.`
						}
					}
					else {
						const armor = await app.player.getArmor(user, serverSideGuildId)
						let healthReduct = Math.floor((Math.random() * (10 - 5 + 1)) + 5)

						if (armor) {
							const armorReduction = Math.floor(healthReduct * app.itemdata[armor].shieldInfo.protection)
							healthReduct -= armorReduction

							quote = `<@${user}> was hit for ~~${healthReduct + armorReduction}~~ ${app.itemdata[armor].icon}**${healthReduct}** damage.`
						}
						else {
							quote = `<@${user}> was hit for **${healthReduct}** damage.`
						}

						if (userRow.health - healthReduct <= 0) {
							// player was killed
							const randomItems = await app.itm.getRandomUserItems(userItems, 2)
							const minSteal = Math.floor(userRow.money * 0.15)
							const maxSteal = Math.floor(userRow.money * 0.55)
							const moneyStolen = Math.floor((Math.random() * (maxSteal - minSteal + 1)) + minSteal)

							await app.itm.removeItem(user, randomItems.amounts, null, serverSideGuildId)
							await app.player.removeMoney(user, moneyStolen, serverSideGuildId)

							if (serverSideGuildId) {
								await app.query(`UPDATE server_scores SET deaths = deaths + 1 WHERE userId = ${user} AND guildId = ${serverSideGuildId}`)
								await app.query(`UPDATE server_scores SET health = 100 WHERE userId = ${user} AND guildId = ${serverSideGuildId}`)
							}
							else {
								await app.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${user}`)
								await app.query(`UPDATE scores SET health = 100 WHERE userId = ${user}`)
							}

							if (randomItems.items.length) {
								quote += ` ${app.icons.death_skull} **${joined[user].username} DIED** and lost ${app.common.formatNumber(moneyStolen)}, ${randomItems.display.join(', ')}...`
							}
							else {
								quote += ` ${app.icons.death_skull} **${joined[user].username} DIED** and lost ${app.common.formatNumber(moneyStolen)}.`
							}
						}
						else {
							await app.player.subHealth(user, healthReduct, serverSideGuildId)

							quote += ` **${joined[user].username}** now has ❤️ **${userRow.health - healthReduct} / ${userRow.maxHealth}** health.`
						}
					}

					results.push(quote)
				}

				if (results.length) {
					await message.channel.createMessage(`**Event Results - __ELF RAMPAGE__**\n\n${wasSuccessful ? '✅ The attack was a success!' : '❌ The attack failed.'}\n\n${results.join('\n')}`)
				}
			})
		}
		catch (err) {
			// kicked bot during event?
			console.warn(err)
		}
	}
}

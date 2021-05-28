const { CLANS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'raid',
	aliases: [],
	description: 'Raid another clan.',
	long: 'Raid another clan. A clan can be raided if they have 0 health.',
	args: { clan: 'Name of clan to raid.' },
	examples: ['clan raid Mod Squad'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 1,

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const raidCD = await app.cd.getCD(scoreRow.clanId, 'raid')

		if (!args.length) {
			return reply(message, '❌ You need to specify the name of the clan you want to raid.')
		}
		else if (raidCD) {
			return reply(message, `Your clan just raided! Wait \`${raidCD}\` before raiding another clan.`)
		}

		const clanName = args.join(' ')
		const clanRow = await app.clans.searchClanRow(clanName)

		if (!clanRow) {
			return reply(message, 'I could not find a clan with that name! Maybe you misspelled it?')
		}
		else if (clanRow.clanId === scoreRow.clanId) {
			return reply(message, 'Raiding yourself???? What.')
		}
		else if (await app.cd.getCD(clanRow.clanId, 'raided')) {
			return reply(message, 'That clan just got raided! Let the clan recuperate before raiding them again.')
		}

		try {
			const transaction = await app.mysql.beginTransaction()
			const raiderRow = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
			const victimRow = await app.clans.getRowForUpdate(transaction.query, clanRow.clanId)

			const raidEmbed = new app.Embed()
				.setAuthor(`${message.author.username} | ${raiderRow.name}`, message.author.avatarURL)
				.setDescription(`Raiding: \`${clanRow.name}\``)
				.setTitle(app.icons.loading)

			const botMsg = await message.channel.createMessage(raidEmbed)

			if (victimRow.health > 0) {
				await transaction.commit()

				const raidableEmbed = new app.Embed()
					.setAuthor(`${message.author.username} | ${raiderRow.name}`, message.author.avatarURL)
					.setDescription(`❌ Raid failed!\n\n\`${clanRow.name}\` has ${app.icons.health.full} **${clanRow.health} / ${clanRow.maxHealth}** health.\n\nYou can lower the health of this clan with explosives such as ${app.itemdata.c4.icon}\`c4\`.`)
					.setColor(15083840)

				setTimeout(() => {
					botMsg.edit(raidableEmbed)
				}, 2000)
			}
			else {
				const raiderItems = await app.itm.getItemObjectForUpdate(transaction.query, scoreRow.clanId)
				const victimItems = await app.itm.getItemObjectForUpdate(transaction.query, clanRow.clanId)

				const raiderClanData = await app.clans.getClanData(raiderRow, raiderItems)
				const itemsToSteal = raiderClanData.vaultSlots - raiderClanData.itemCount
				const moneyToSteal = Math.max(0, CLANS.levels[raiderRow.level].bankLimit - raiderRow.money)
				const moneyStolen = Math.min(victimRow.money, moneyToSteal)
				let itemsStolen
				let itemsStolenDisplay

				if (itemsToSteal <= 0 && moneyToSteal === 0) {
					await transaction.commit()

					const raidedEmbed = new app.Embed()
						.setAuthor(`${message.author.username} | ${raiderRow.name}`, message.author.avatarURL)
						.setDescription('❌ Raid failed!\n\nYour clan has no room to steal from other clans (your bank and item storage are full, you should try to clear some space before raiding another clan).')
						.setColor(15083840)

					setTimeout(() => {
						botMsg.edit(raidedEmbed)
					}, 2000)

					return
				}

				if (itemsToSteal > 0) {
					itemsStolen = await app.itm.getRandomUserItems(victimItems, itemsToSteal)

					if (itemsStolen.items.length !== 0 && itemsStolen.display.length > 17) {
						itemsStolenDisplay = `${itemsStolen.display.slice(0, 17).join('\n')}\n...and **${itemsStolen.display.length - 17}** more items.`
					}
					else if (itemsStolen.items.length !== 0) {
						itemsStolenDisplay = itemsStolen.display.join('\n')
					}
					else {
						itemsStolenDisplay = 'No items to steal'
					}
				}
				else {
					itemsStolenDisplay = 'Your clan\'s storage was too full to steal any items!'
				}

				// all checks passed, add cooldowns
				await app.cd.setCD(victimRow.clanId, 'raided', 3600 * 1000 * 24)
				await app.cd.setCD(raiderRow.clanId, 'raid', 3600 * 1000)
				await app.clans.addLog(raiderRow.clanId, `${message.author.username} raided ${victimRow.name}`)
				await app.clans.addLog(victimRow.clanId, `Raided by ${raiderRow.name} (${`${message.author.username}#${message.author.discriminator}`})`)

				// transfer money
				await app.clans.removeMoneySafely(transaction.query, victimRow.clanId, moneyStolen)
				await app.clans.addMoneySafely(transaction.query, raiderRow.clanId, moneyStolen)

				// transfer items
				if (itemsStolen && itemsStolen.amounts.length) {
					await app.itm.removeItemSafely(transaction.query, victimRow.clanId, itemsStolen.amounts)
					await app.itm.addItemSafely(transaction.query, raiderRow.clanId, itemsStolen.amounts)
				}

				const raidedEmbed = new app.Embed()
					.setAuthor(`${message.author.username} | ${raiderRow.name}`, message.author.avatarURL)
					.setDescription('✅ Raid successful!')
					.addField('Scrap Stolen', app.common.formatNumber(moneyStolen))
					.addField(`Items (${itemsStolen ? itemsStolen.items.length : 0})`, itemsStolenDisplay)
					.setColor(15083840)

				// degrade clans level
				if (victimRow.level - 1 >= 1) {
					await transaction.query('UPDATE clans SET level = ?, maxHealth = ? WHERE clanId = ?', [victimRow.level - 1, CLANS.levels[victimRow.level - 1].maxHealth, victimRow.clanId])
					raidedEmbed.setFooter(`The base of ${victimRow.name} degraded from ${CLANS.levels[victimRow.level].type} to ${CLANS.levels[victimRow.level - 1].type}.`)
				}

				// finished trading items/money, end transaction
				await transaction.commit()

				setTimeout(() => {
					botMsg.edit(raidedEmbed)
				}, 2000)

				await app.clans.raidNotify(victimRow.clanId, raiderRow.name, moneyStolen, getRaidedItemDisplay(itemsStolen))
			}
		}
		catch (err) {
			console.log(err)

			const errorEmbed = new app.Embed()
				.setAuthor(`${message.author.username} | ${clanRow.name}`, message.author.avatarURL)
				.setDescription('There was an error while trying to raid, you should probably contact the bot developer.')

			await message.channel.createMessage(errorEmbed).catch(console.log)
		}
	}
}

function getRaidedItemDisplay (itemsStolen) {
	if (!itemsStolen) {
		return 'Their clan storage was too full of items to steal anything!'
	}
	else if (itemsStolen.items.length !== 0 && itemsStolen.display.length > 17) {
		return `${itemsStolen.display.slice(0, 17).join('\n')}\n...and **${itemsStolen.display.length - 17}** more items.`
	}
	else if (itemsStolen.items.length !== 0) {
		return itemsStolen.display.join('\n')
	}

	return 'No items to steal'
}

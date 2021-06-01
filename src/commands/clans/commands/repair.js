const { CLANS, BUTTONS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'repair',
	aliases: [],
	description: 'Repair your clan using materials.',
	long: 'Used to repair your clan. The material used to repair the clan changes based on the clan level.',
	args: {
		amount: 'Amount of times to repair.'
	},
	examples: ['clan repair 3'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 3,

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const clanRow = await app.clans.getRow(scoreRow.clanId)
		const clanStats = CLANS.levels[clanRow.level]
		let amount = app.parse.numbers(args)[0] || 1

		if (clanRow.health >= clanRow.maxHealth) {
			return reply(message, '❌ Your clan is at max health, there\'s no need to repair it!')
		}

		// calculate max times clan can be repaired
		amount = Math.min(amount, Math.ceil((clanRow.maxHealth - clanRow.health) / clanStats.repair.heals))

		const maxRepair = Math.min(clanRow.maxHealth - clanRow.health, clanStats.repair.heals * amount)

		const botMessage = await reply(message, {
			content: `Do you want to repair the clan base from ${app.player.getHealthIcon(clanRow.health, clanRow.maxHealth)} **${clanRow.health} / ${clanRow.maxHealth}** to ${app.player.getHealthIcon(clanRow.health + maxRepair, clanRow.maxHealth)} **${clanRow.health + maxRepair} / ${clanRow.maxHealth}**? ` +
				`This will cost **${amount}x** ${app.itemdata[clanStats.repair.item].icon}\`${clanStats.repair.item}\`.`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				try {
					const transaction = await app.mysql.beginTransaction()
					const clanRowSafe = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
					const clanItems = await app.itm.getItemObjectForUpdate(transaction.query, scoreRow.clanId)

					if (clanRow.health !== clanRowSafe.health) {
						await transaction.commit()

						return confirmed.respond({
							content: '❌ Repair failed.',
							components: []
						})
					}
					else if (clanRowSafe.health >= clanRowSafe.maxHealth) {
						await transaction.commit()

						return confirmed.respond({
							content: '❌ Your clan is at max health, there\'s no need to repair it!',
							components: []
						})
					}
					else if (!app.itm.hasItems(clanItems, clanStats.repair.item, amount)) {
						await transaction.commit()

						return confirmed.respond({
							content: `❌ Your clan is missing the materials needed to repair. Make sure you deposit **${amount}x** ${app.itemdata[clanStats.repair.item].icon}\`${clanStats.repair.item}\` to the clan item storage.`,
							components: []
						})
					}

					await app.itm.removeItemSafely(transaction.query, scoreRow.clanId, clanStats.repair.item, amount)

					await transaction.query('UPDATE clans SET health = health + ? WHERE clanId = ?', [maxRepair, scoreRow.clanId])
					await transaction.commit()

					return confirmed.respond({
						content: `✅ Successfully repaired the clan from ${app.player.getHealthIcon(clanRowSafe.health, clanRowSafe.maxHealth)} **${clanRowSafe.health} / ${clanRowSafe.maxHealth}** to ${app.player.getHealthIcon(clanRowSafe.health + maxRepair, clanRowSafe.maxHealth)} **${clanRowSafe.health + maxRepair} / ${clanRowSafe.maxHealth}** health!`,
						components: []
					})
				}
				catch (err) {
					console.log(err)
					await confirmed.respond({
						content: '❌ Repair failed.',
						components: []
					})
				}
			}
			else {
				await botMessage.delete()
			}
		}
		catch (err) {
			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}

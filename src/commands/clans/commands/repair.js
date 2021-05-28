const { CLANS } = require('../../../resources/constants')
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

		await reply(message, `Do you want to repair the clan base from ${app.icons.health.full} **${clanRow.health} / ${clanRow.maxHealth}** to ${app.icons.health.full} **${clanRow.health + maxRepair} / ${clanRow.maxHealth}**? ` +
			`This will cost **${amount}x** ${app.itemdata[clanStats.repair.item].icon}\`${clanStats.repair.item}\`.\n\n` +
			'Type `yes` to continue or `no` to cancel.')

		const result = await app.msgCollector.awaitMessages(message.author.id, message.channel.id, m => m.author.id === message.author.id && ['yes', 'no'].includes(m.content.toLowerCase()))

		if (result === 'time') {
			return reply(message, 'You ran out of time.')
		}
		else if (result[0].content.toLowerCase() === 'no') {
			return reply(result[0], 'Canceled repair.')
		}

		try {
			const transaction = await app.mysql.beginTransaction()
			const clanRowSafe = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
			const clanItems = await app.itm.getItemObjectForUpdate(transaction.query, scoreRow.clanId)

			if (clanRow.health !== clanRowSafe.health) {
				await transaction.commit()
				return reply(result[0], '❌ Repair failed.')
			}
			else if (clanRowSafe.health >= clanRowSafe.maxHealth) {
				await transaction.commit()
				return reply(result[0], '❌ Your clan is at max health, there\'s no need to repair it!')
			}
			else if (!app.itm.hasItems(clanItems, clanStats.repair.item, amount)) {
				await transaction.commit()
				return reply(result[0], `❌ Your clan is missing the materials needed to repair. Make sure you deposit **${amount}x** ${app.itemdata[clanStats.repair.item].icon}\`${clanStats.repair.item}\` in the clan item storage.`)
			}

			await app.itm.removeItemSafely(transaction.query, scoreRow.clanId, clanStats.repair.item, amount)

			await transaction.query('UPDATE clans SET health = health + ? WHERE clanId = ?', [maxRepair, scoreRow.clanId])
			await transaction.commit()

			return reply(result[0], `✅ Successfully repaired the clan from ${app.icons.health.full} **${clanRowSafe.health} / ${clanRowSafe.maxHealth}** to ${app.icons.health.full} **${clanRowSafe.health + maxRepair} / ${clanRowSafe.maxHealth}** health!`)
		}
		catch (err) {
			console.log(err)
			await reply(result[0], '❌ Repair failed.')
		}
	}
}

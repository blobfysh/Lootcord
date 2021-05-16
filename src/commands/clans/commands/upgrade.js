const { CLANS } = require('../../../resources/constants')

exports.command = {
	name: 'upgrade',
	aliases: [],
	description: 'Upgrade your clan.',
	long: 'Used to upgrade your clan. Upgrading the clan makes the clan harder to raid and allows you to store more items/scrap.',
	args: { '@user/discord#tag': 'User to promote.' },
	examples: ['clan promote @blobfysh'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 3,

	async execute(app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const clanRow = await app.clans.getRow(scoreRow.clanId)

		if (clanRow.level === 5) {
			return message.reply('❌ Your clan is fully upgraded!')
		}

		const previousStats = CLANS.levels[clanRow.level]
		const upgradedStats = CLANS.levels[clanRow.level + 1]

		await message.reply(`Do you want to upgrade your clan base from **${previousStats.type}** to **${upgradedStats.type}**? ` +
			`This will cost **${app.common.formatNumber(upgradedStats.cost.money)}** and ${app.itm.getDisplay(upgradedStats.cost.materials)}. The following will change:\n\n` +
			`Max Health: ~~${previousStats.maxHealth}~~ ${app.icons.health.full} **${upgradedStats.maxHealth}**\n` +
			`Item Storage: ~~${previousStats.itemLimit}~~ **${upgradedStats.itemLimit}** items max\n` +
			`Scrap Storage: ~~${app.common.formatNumber(previousStats.bankLimit, true)}~~ **${app.common.formatNumber(upgradedStats.bankLimit)}**\n` +
			`Upkeep Costs: ~~${app.common.formatNumber(previousStats.upkeep, true)}~~ **${app.common.formatNumber(upgradedStats.upkeep)}**\n\n` +
			'Type `yes` to continue or `no` to cancel.')

		const result = await app.msgCollector.awaitMessages(message.author.id, message.channel.id, m => m.author.id === message.author.id && ['yes', 'no'].includes(m.content.toLowerCase()))

		if (result === 'time') {
			return message.reply('You ran out of time.')
		}
		else if (result[0].content === 'no') {
			return result[0].reply('Canceled upgrade.')
		}

		try {
			const transaction = await app.mysql.beginTransaction()
			const clanRowSafe = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
			const clanItems = await app.itm.getItemObjectForUpdate(transaction.query, scoreRow.clanId)

			if (clanRowSafe.level === 5) {
				await transaction.commit()
				return result[0].reply('❌ Upgrade failed.')
			}
			else if (clanRowSafe.money < upgradedStats.cost.money) {
				await transaction.commit()
				return result[0].reply(`❌ Your clan only has **${app.common.formatNumber(clanRowSafe.money)}**, you need **${app.common.formatNumber(upgradedStats.cost.money)}** to upgrade.`)
			}
			else if (!app.itm.hasItems(clanItems, upgradedStats.cost.materials)) {
				await transaction.commit()
				return result[0].reply(`❌ Your clan is missing the materials needed to upgrade. Make sure you deposit ${app.itm.getDisplay(upgradedStats.cost.materials)} in the clan item storage.`)
			}

			await app.clans.removeMoneySafely(transaction.query, scoreRow.clanId, upgradedStats.cost.money)
			await app.itm.removeItemSafely(transaction.query, scoreRow.clanId, upgradedStats.cost.materials)

			await transaction.query('UPDATE clans SET level = level + 1, maxHealth = ? WHERE clanId = ?', [upgradedStats.maxHealth, scoreRow.clanId])
			await transaction.commit()

			return result[0].reply(`✅ Successfully upgraded the clan to **${upgradedStats.type}**. Make sure to pay the daily upkeep!`)
		}
		catch (err) {
			console.log(err)
			await result[0].reply('❌ Upgrade failed.')
		}
	}
}

const { CLANS, BUTTONS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'upgrade',
	aliases: [],
	description: 'Upgrade your clan.',
	long: 'Used to upgrade your clan. Upgrading the clan makes the clan harder to raid and allows you to store more items/scrap.',
	args: {},
	examples: [],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 3,

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const clanRow = await app.clans.getRow(scoreRow.clanId)

		if (clanRow.level === 5) {
			return reply(message, '❌ Your clan is fully upgraded!')
		}

		const previousStats = CLANS.levels[clanRow.level]
		const upgradedStats = CLANS.levels[clanRow.level + 1]

		const botMessage = await reply(message, {
			content: `Do you want to upgrade your clan base from **${previousStats.type}** to **${upgradedStats.type}**? ` +
				`This will cost **${app.common.formatNumber(upgradedStats.cost.money)}** and ${app.itm.getDisplay(upgradedStats.cost.materials)}. The following will change:\n\n` +
				`Max Health: ~~${previousStats.maxHealth}~~ ${app.icons.health.full} **${upgradedStats.maxHealth}**\n` +
				`Item Storage: ~~${previousStats.itemLimit}~~ **${upgradedStats.itemLimit}** items max\n` +
				`Scrap Storage: ~~${app.common.formatNumber(previousStats.bankLimit, true)}~~ **${app.common.formatNumber(upgradedStats.bankLimit)}**\n` +
				`Upkeep Costs: ~~${app.common.formatNumber(previousStats.upkeep, true)}~~ **${app.common.formatNumber(upgradedStats.upkeep)}**`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				try {
					const transaction = await app.mysql.beginTransaction()
					const clanRowSafe = await app.clans.getRowForUpdate(transaction.query, scoreRow.clanId)
					const clanItems = await app.itm.getItemObjectForUpdate(transaction.query, scoreRow.clanId)

					if (clanRow.level !== clanRowSafe.level) {
						await transaction.commit()

						return confirmed.respond({
							content: '❌ Upgrade failed.',
							components: []
						})
					}
					else if (clanRowSafe.level === 5) {
						await transaction.commit()

						return confirmed.respond({
							content: '❌ Upgrade failed.',
							components: []
						})
					}
					else if (clanRowSafe.money < upgradedStats.cost.money) {
						await transaction.commit()

						return confirmed.respond({
							content: `❌ Your clan only has **${app.common.formatNumber(clanRowSafe.money)}**. You need **${app.common.formatNumber(upgradedStats.cost.money)}** to upgrade.`,
							components: []
						})
					}
					else if (!app.itm.hasItems(clanItems, upgradedStats.cost.materials)) {
						await transaction.commit()

						return confirmed.respond({
							content: `❌ Your clan is missing the materials needed to upgrade. Make sure you deposit ${app.itm.getDisplay(upgradedStats.cost.materials)} to the clan item storage.`,
							components: []
						})
					}

					await app.clans.removeMoneySafely(transaction.query, scoreRow.clanId, upgradedStats.cost.money)
					await app.itm.removeItemSafely(transaction.query, scoreRow.clanId, upgradedStats.cost.materials)

					await transaction.query('UPDATE clans SET level = level + 1, maxHealth = ? WHERE clanId = ?', [upgradedStats.maxHealth, scoreRow.clanId])
					await transaction.commit()

					return confirmed.respond({
						content: `✅ Successfully upgraded the clan to **${upgradedStats.type}**. Make sure to pay the daily upkeep!`,
						components: []
					})
				}
				catch (err) {
					console.log(err)
					await confirmed.respond({
						content: '❌ Upgrade failed.',
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

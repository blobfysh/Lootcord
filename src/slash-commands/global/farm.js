const { InteractionResponseType } = require('slash-commands')

exports.command = {
	name: 'farm',
	description: 'Go farming for resources/loot.',
	requiresAcc: true,
	requiresActive: true,
	options: [],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const hourlyCD = await app.cd.getCD(interaction.member.user.id, 'hourly', { serverSideGuildId })

		if (hourlyCD) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `You need to wait \`${hourlyCD}\` before farming again.`
				}
			})
		}

		const row = await app.player.getRow(interaction.member.user.id, serverSideGuildId)
		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(interaction.member.user.id, serverSideGuildId), row)
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		if (!hasEnough) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `❌ **You don't have enough space in your inventory!** (You need **1** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`
				}
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'hourly', app.config.cooldowns.hourly * 1000, { serverSideGuildId })

		const luck = row.luck >= 40 ? 10 : Math.floor(row.luck / 4)
		const chance = Math.floor(Math.random() * 100) + luck

		// 4% increased up to 14% by luck
		if (chance >= 96) {
			await app.itm.addItem(interaction.member.user.id, 'high_quality_metal', 1, serverSideGuildId)
			await interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `You decide to go ⛏️ mining and find a **RARE** ${app.itemdata.high_quality_metal.icon}\`high_quality_metal\`!`
				}
			})
		}
		else {
			const rand = Math.random()

			if (rand < 0.6) {
				await app.itm.addItem(interaction.member.user.id, 'crate', 1, serverSideGuildId)
				await interaction.respond({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: `You decide to scavenge for loot and find **1x** ${app.itemdata.crate.icon}\`crate\`!`
					}
				})
			}
			else if (rand < 0.7) {
				await app.itm.addItem(interaction.member.user.id, 'metal', 1, serverSideGuildId)
				await interaction.respond({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: `You decide to go ⛏️ mining and bring back **1x** ${app.itemdata.metal.icon}\`metal\`!`
					}
				})
			}
			else if (rand < 0.85) {
				await app.itm.addItem(interaction.member.user.id, 'stone', 1, serverSideGuildId)
				await interaction.respond({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: `You decide to go ⛏️ mining and bring back **1x** ${app.itemdata.stone.icon}\`stone\`!`
					}
				})
			}
			else {
				await app.itm.addItem(interaction.member.user.id, 'wood', 1, serverSideGuildId)
				await interaction.respond({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: `You decide to go 🪓 chop some trees and receive **1x** ${app.itemdata.wood.icon}\`wood\`!`
					}
				})
			}
		}
	}
}

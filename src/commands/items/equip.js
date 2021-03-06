const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'equip',
	aliases: ['wear'],
	description: 'Equip an item.',
	long: 'Allows user to equip different storage containers and inventory banners. You can also equip a badge to set it as your display badge.',
	args: { 'item/banner': 'Item to equip.' },
	examples: ['equip wood_box', 'equip recruit'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const equipItem = app.parse.items(args)[0]
		const equipBadge = app.parse.badges(args)[0]

		if (equipItem && app.itemdata[equipItem].equippable) {
			const userRow = await app.player.getRow(message.author.id, serverSideGuildId)
			const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
			const hasPack = await app.itm.hasItems(userItems, equipItem, 1)

			if (hasPack && serverSideGuildId) {
				// server-side economy
				if (app.itemdata[equipItem].type === 'backpack') {
					await app.itm.removeItem(message.author.id, equipItem, 1, serverSideGuildId)
					await app.query(`UPDATE server_scores SET backpack = '${equipItem}' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)

					if (userRow.backpack !== 'none') {
						await app.query(`UPDATE server_scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)

						await app.itm.addItem(message.author.id, userRow.backpack, 1, serverSideGuildId)

						await app.query(`UPDATE server_scores SET inv_slots = inv_slots + ${app.itemdata[equipItem].inv_slots} WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)

						await reply(message, `Successfully unequipped ${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\` and equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
					else {
						await app.query(`UPDATE server_scores SET inv_slots = inv_slots + ${app.itemdata[equipItem].inv_slots} WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)

						await reply(message, `Successfully equipped ${app.itemdata[equipItem].icon}\`${equipItem}\` and gained **${app.itemdata[equipItem].inv_slots}** item slots. (${app.itemdata[equipItem].inv_slots + app.config.baseInvSlots + userRow.inv_slots} max)`)
					}
				}
				else if (app.itemdata[equipItem].isBanner) {
					await app.query(`UPDATE server_scores SET banner = '${equipItem}' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
					await app.itm.removeItem(message.author.id, equipItem, 1, serverSideGuildId)

					if (userRow.banner !== 'none') {
						await app.itm.addItem(message.author.id, userRow.banner, 1, serverSideGuildId)

						await reply(message, `Successfully unequipped ${app.itemdata[userRow.banner].icon}\`${userRow.banner}\` and equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
					else {
						await reply(message, `Successfully equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
				}
				else {
					await reply(message, '❌ I don\'t recognize that item as an equippable? You should join the `discord` server and report this.')
				}
			}
			else if (hasPack) {
				if (app.itemdata[equipItem].type === 'backpack') {
					await app.itm.removeItem(message.author.id, equipItem, 1)
					await app.query(`UPDATE scores SET backpack = '${equipItem}' WHERE userId = ${message.author.id}`)

					if (userRow.backpack !== 'none') {
						await app.query(`UPDATE scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id}`)

						await app.itm.addItem(message.author.id, userRow.backpack, 1)

						await app.query(`UPDATE scores SET inv_slots = inv_slots + ${app.itemdata[equipItem].inv_slots} WHERE userId = ${message.author.id}`)

						await reply(message, `Successfully unequipped ${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\` and equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
					else {
						await app.query(`UPDATE scores SET inv_slots = inv_slots + ${app.itemdata[equipItem].inv_slots} WHERE userId = ${message.author.id}`)

						await reply(message, `Successfully equipped ${app.itemdata[equipItem].icon}\`${equipItem}\` and gained **${app.itemdata[equipItem].inv_slots}** item slots. (${app.itemdata[equipItem].inv_slots + app.config.baseInvSlots + userRow.inv_slots} max)`)
					}
				}
				else if (app.itemdata[equipItem].isBanner) {
					await app.query(`UPDATE scores SET banner = '${equipItem}' WHERE userId = ${message.author.id}`)
					await app.itm.removeItem(message.author.id, equipItem, 1)

					if (userRow.banner !== 'none') {
						await app.itm.addItem(message.author.id, userRow.banner, 1)

						await reply(message, `Successfully unequipped ${app.itemdata[userRow.banner].icon}\`${userRow.banner}\` and equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
					else {
						await reply(message, `Successfully equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
				}
				else {
					await reply(message, '❌ I don\'t recognize that item as an equippable? You should join the `discord` server and report this.')
				}
			}
			else {
				await reply(message, `❌ You don't have a ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
			}
		}
		else if (equipBadge) {
			const playerBadges = await app.itm.getBadges(message.author.id, serverSideGuildId)

			if (!playerBadges.includes(equipBadge)) {
				return reply(message, '❌ You don\'t own that badge!')
			}

			if (serverSideGuildId) {
				await app.query('UPDATE server_scores SET badge = ? WHERE userId = ? AND guildId = ?', [equipBadge, message.author.id, serverSideGuildId])
			}
			else {
				await app.query('UPDATE scores SET badge = ? WHERE userId = ?', [equipBadge, message.author.id])
			}

			await reply(message, `✅ Successfully made ${app.badgedata[equipBadge].icon}\`${equipBadge}\` your display badge!`)
		}
		else if (equipItem && (app.itemdata[equipItem].category === 'Ranged' || app.itemdata[equipItem].category === 'Melee')) {
			return reply(message, `${app.itemdata[equipItem].icon}\`${equipItem}\` is a weapon, you should attack another player using this: \`${prefix}use ${equipItem} @user\``)
		}
		else if (equipItem) {
			return reply(message, `${app.itemdata[equipItem].icon}\`${equipItem}\` cannot be equipped. Specify a storage container, banner or badge to equip.`)
		}
		else {
			await reply(message, `Specify a valid item that can be equipped. \`${prefix}equip <item>\`. You can also equip a badge to set it as your display badge.`)
		}
	}
}

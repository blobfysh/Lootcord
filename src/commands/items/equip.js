module.exports = {
	name: 'equip',
	aliases: ['wear'],
	description: 'Equip an item.',
	long: 'Allows user to equip different storage containers and inventory banners. You can also equip a badge to set it as your display badge.',
	args: { 'item/banner': 'Item to equip.' },
	examples: ['equip wood_box', 'equip recruit'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const equipItem = app.parse.items(args)[0]
		const equipBadge = app.parse.badges(args)[0]

		if (equipItem && app.itemdata[equipItem].equippable) {
			const userRow = await app.player.getRow(message.author.id)
			const userItems = await app.itm.getItemObject(message.author.id)
			const hasPack = await app.itm.hasItems(userItems, equipItem, 1)

			if (hasPack) {
				if (app.itemdata[equipItem].type === 'backpack') {
					await app.itm.removeItem(message.author.id, equipItem, 1)
					await app.query(`UPDATE scores SET backpack = '${equipItem}' WHERE userId = ${message.author.id}`)

					if (userRow.backpack !== 'none') {
						await app.query(`UPDATE scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id}`)

						await app.itm.addItem(message.author.id, userRow.backpack, 1)

						await app.query(`UPDATE scores SET inv_slots = inv_slots + ${app.itemdata[equipItem].inv_slots} WHERE userId = ${message.author.id}`)

						message.reply(`Successfully unequipped ${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\` and equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
					else {
						await app.query(`UPDATE scores SET inv_slots = inv_slots + ${app.itemdata[equipItem].inv_slots} WHERE userId = ${message.author.id}`)

						message.reply(`Successfully equipped ${app.itemdata[equipItem].icon}\`${equipItem}\` and gained **${app.itemdata[equipItem].inv_slots}** item slots. (${app.itemdata[equipItem].inv_slots + app.config.baseInvSlots + userRow.inv_slots} max)`)
					}
				}
				else if (app.itemdata[equipItem].isBanner) {
					await app.query(`UPDATE scores SET banner = '${equipItem}' WHERE userId = ${message.author.id}`)
					await app.itm.removeItem(message.author.id, equipItem, 1)

					if (userRow.banner !== 'none') {
						await app.itm.addItem(message.author.id, userRow.banner, 1)

						message.reply(`Successfully unequipped ${app.itemdata[userRow.banner].icon}\`${userRow.banner}\` and equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
					else {
						message.reply(`Successfully equipped ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
					}
				}
				else {
					message.reply('❌ I don\'t recognize that item as an equippable? You should join the `discord` server and report this.')
				}
			}
			else {
				message.reply(`❌ You don't have a ${app.itemdata[equipItem].icon}\`${equipItem}\`.`)
			}
		}
		else if (equipBadge) {
			const playerBadges = await app.itm.getBadges(message.author.id)

			if (!playerBadges.includes(equipBadge)) {
				return message.reply('❌ You don\'t own that badge!')
			}

			await app.query('UPDATE scores SET badge = ? WHERE userId = ?', [equipBadge, message.author.id])

			message.reply(`✅ Successfully made ${app.badgedata[equipBadge].icon}\`${equipBadge}\` your display badge!`)
		}
		else if (equipItem && (app.itemdata[equipItem].category === 'Ranged' || app.itemdata[equipItem].category === 'Melee')) {
			return message.reply(`${app.itemdata[equipItem].icon}\`${equipItem}\` is a weapon, you should attack another player using this: \`${prefix}use ${equipItem} @user\``)
		}
		else if (equipItem) {
			return message.reply(`${app.itemdata[equipItem].icon}\`${equipItem}\` cannot be equipped. Specify a storage container, banner or badge to equip.`)
		}
		else {
			message.reply(`Specify a valid item that can be equipped. \`${prefix}equip <item>\`. You can also equip a badge to set it as your display badge.`)
		}
	}
}

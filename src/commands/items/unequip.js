const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'unequip',
	aliases: [],
	description: 'Unequip an item.',
	long: 'Unequip your current storage container or banner.',
	args: { 'item/banner': 'Item to unequip.' },
	examples: ['unequip wood_box', 'unequip banner', 'unequip storage'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const userRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const equipitem = app.parse.items(args)[0]
		const equipBadge = app.parse.badges(args)[0]

		if (userRow.backpack === equipitem || args[0] === 'storage') {
			if (userRow.backpack !== 'none') {
				if (serverSideGuildId) {
					await app.query(`UPDATE server_scores SET backpack = 'none' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
					await app.query(`UPDATE server_scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
					await app.itm.addItem(message.author.id, userRow.backpack, 1, serverSideGuildId)
				}
				else {
					await app.query(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`)
					await app.query(`UPDATE scores SET inv_slots = inv_slots - ${app.itemdata[userRow.backpack].inv_slots} WHERE userId = ${message.author.id}`)
					await app.itm.addItem(message.author.id, userRow.backpack, 1)
				}

				await reply(message, `✅ Successfully unequipped ${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\`.\nYour carry capacity is now **${app.config.baseInvSlots + (userRow.inv_slots - app.itemdata[userRow.backpack].inv_slots)}** items.`)
			}
			else {
				await reply(message, '❌ You don\'t have a storage container equipped! You can check what containers you own in your `inventory`.')
			}
		}

		else if (userRow.banner === equipitem || args[0] === 'banner') {
			if (userRow.banner !== 'none') {
				if (serverSideGuildId) {
					await app.query(`UPDATE server_scores SET banner = 'none' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
					await app.itm.addItem(message.author.id, userRow.banner, 1, serverSideGuildId)
				}
				else {
					await app.query(`UPDATE scores SET banner = 'none' WHERE userId = ${message.author.id}`)
					await app.itm.addItem(message.author.id, userRow.banner, 1)
				}

				await reply(message, `✅ Successfully unequipped ${app.itemdata[userRow.banner].icon}\`${userRow.banner}\`.`)
			}
			else {
				await reply(message, '❌ You don\'t have a banner equipped! You can check what banners you own on your `profile`.')
			}
		}

		else if (equipBadge || args[0] === 'badge') {
			if (serverSideGuildId) {
				await app.query(`UPDATE server_scores SET badge = 'none' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
			}
			else {
				await app.query(`UPDATE scores SET badge = 'none' WHERE userId = ${message.author.id}`)
			}

			return reply(message, '✅ Successfully unequipped your display badge!')
		}

		else {
			await reply(message, `Specify a storage container, banner, or badge to unequip. \`${prefix}unequip <item/badge>\``)
		}
	}
}

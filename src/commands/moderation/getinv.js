const { ITEM_TYPES } = require('../../resources/constants')

exports.command = {
	name: 'getinv',
	aliases: ['geti'],
	description: 'Fetches a users inventory.',
	long: 'Fetches a users inventory using their ID.',
	args: {
		'User ID': 'ID of user to check.'
	},
	examples: ['getinv 168958344361541633'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}

		try {
			const row = await app.player.getRow(userID)

			if (!row) {
				return message.reply('❌ User has no account.')
			}

			const userInfo = await app.common.fetchUser(userID, { cacheIPC: false })
			const itemObject = await app.itm.getItemObject(userID)
			const usersItems = await app.itm.getUserItems(itemObject)
			const itemCt = await app.itm.getItemCount(itemObject, row)
			const armorLeft = await app.cd.getCD(userID, 'shield')
			const armor = await app.player.getArmor(userID)
			const passiveShield = await app.cd.getCD(userID, 'passive_shield')

			const embedInfo = new app.Embed()
				.setTitle(`${userInfo.username}#${userInfo.discriminator}'s Inventory`)
				.setColor(13451564)

			if (armorLeft) {
				embedInfo.addField(armor ? 'Armor' : '🛡️ Armor', armor ? `${app.itemdata[armor].icon}\`${armorLeft}\`` : `\`${armorLeft}\``)
			}
			if (passiveShield) {
				embedInfo.addField('🛡️ Passive Shield', `\`${passiveShield}\``)
			}

			let healthStr = `**${row.health} / ${row.maxHealth}** HP${app.player.getHealthIcon(row.health, row.maxHealth, true)}`

			if (row.bleed > 0) {
				healthStr += `\n🩸 Bleeding: **${row.bleed}**`
			}
			if (row.burn > 0) {
				healthStr += `\n🔥 Burning: **${row.burn}**`
			}

			embedInfo.addField('Health', healthStr, true)

			embedInfo.addField('Money', `${app.common.formatNumber(row.money)}\n${app.common.formatNumber(row.scrap, false, true)}`, true)

			if (row.backpack === 'none') {
				embedInfo.addField('Storage Container', 'None equipped', true)
			}
			else {
				embedInfo.addField('Storage Container', `${app.itemdata[row.backpack].icon}\`${row.backpack}\``, true)
			}

			embedInfo.addBlankField()

			// item fields
			if (usersItems.ranged.length) {
				embedInfo.addField(ITEM_TYPES.ranged.name, usersItems.ranged.join('\n'), true)
			}

			if (usersItems.melee.length) {
				embedInfo.addField(ITEM_TYPES.melee.name, usersItems.melee.join('\n'), true)
			}

			if (usersItems.usables.length) {
				embedInfo.addField(ITEM_TYPES.items.name, usersItems.usables.join('\n'), true)
			}

			if (usersItems.ammo.length) {
				embedInfo.addField(ITEM_TYPES.ammo.name, usersItems.ammo.join('\n'), true)
			}

			if (usersItems.materials.length) {
				embedInfo.addField(ITEM_TYPES.materials.name, usersItems.materials.join('\n'), true)
			}

			if (usersItems.storage.length) {
				embedInfo.addField(ITEM_TYPES.storage.name, usersItems.storage.join('\n'), true)
			}

			if (!usersItems.ranged.length && !usersItems.melee.length && !usersItems.usables.length && !usersItems.ammo.length && !usersItems.materials.length && !usersItems.storage.length) {
				embedInfo.addField('This inventory is empty! :(', '\u200b')
			}

			embedInfo.addField('\u200b', `Inventory space: ${itemCt.capacity} max | Value: ${app.common.formatNumber(usersItems.invValue)}`)

			message.channel.createMessage(embedInfo)
		}
		catch (err) {
			message.reply(`Error:\`\`\`${err}\`\`\``)
		}
	}
}

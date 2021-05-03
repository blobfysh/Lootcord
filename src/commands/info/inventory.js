const { ITEM_TYPES } = require('../../resources/constants')

exports.command = {
	name: 'inventory',
	aliases: ['inv', 'i'],
	description: 'Displays all items you have.',
	long: 'Shows your current inventory including items, health, level, xp, and money.',
	args: {
		'@user/discord#tag': 'User\'s profile to check.'
	},
	examples: ['inv blobfysh#4679'],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const memberArg = app.parse.members(message, args)[0]

		// no member found in ArgParser
		if (!memberArg) {
			// player was trying to search someone
			if (args.length) {
				message.reply('❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID')
				return
			}

			message.reply(await makeInventory(app, message.author, message.channel.guild.id, serverSideGuildId))
		}
		else {
			message.reply(await makeInventory(app, memberArg, message.channel.guild.id, serverSideGuildId))
		}
	}
}


const makeInventory = exports.makeInventory = async function makeInventory(app, user, guildId, serverSideGuildId) {
	try {
		const userRow = await app.player.getRow(user.id, serverSideGuildId)

		if (!userRow) {
			return {
				content: '❌ The person you\'re trying to search doesn\'t have an account!'
			}
		}

		const isActive = guildId ? await app.player.isActive(user.id, guildId) : false
		const itemObject = await app.itm.getItemObject(user.id, serverSideGuildId)
		const usersItems = await app.itm.getUserItems(itemObject)
		const itemCt = await app.itm.getItemCount(itemObject, userRow)
		const armorLeft = await app.cd.getCD(user.id, 'shield', { serverSideGuildId })
		const armor = await app.player.getArmor(user.id, serverSideGuildId)
		const passiveShield = await app.cd.getCD(user.id, 'passive_shield', { serverSideGuildId })

		const embedInfo = new app.Embed()
			.setTitle(`${isActive ? app.icons.accounts.active : app.icons.accounts.inactive} ${`${user.username}#${user.discriminator}`}'s Inventory`)
			.setColor(13451564)

		if (armorLeft) {
			embedInfo.addField(armor ? 'Armor' : '🛡️ Armor', armor ? `${app.itemdata[armor].icon}\`${armor}\` (\`${armorLeft}\`)` : `\`${armorLeft}\``)
		}
		if (passiveShield) {
			embedInfo.addField('🛡️ Passive Shield', `\`${passiveShield}\` [?](https://lootcord.com/faq#what-is-a-passive-shield 'A passive shield is a 24 hour attack shield given to you when you are killed.\n\nThis shield will automatically be removed if you decide to attack someone.')`)
		}

		let healthStr = `**${userRow.health} / ${userRow.maxHealth}** HP${app.player.getHealthIcon(userRow.health, userRow.maxHealth, true)}`

		if (userRow.bleed > 0) {
			healthStr += `\n🩸 Bleeding: **${userRow.bleed}**`
		}
		if (userRow.burn > 0) {
			healthStr += `\n🔥 Burning: **${userRow.burn}**`
		}

		embedInfo.addField('Health', healthStr, true)

		embedInfo.addField('Money', `${app.common.formatNumber(userRow.money)}\n${app.common.formatNumber(userRow.scrap, false, true)}`, true)

		if (userRow.backpack === 'none') {
			embedInfo.addField('Storage Container', 'None equipped', true)
		}
		else {
			embedInfo.addField('Storage Container', `${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\``, true)
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

		if (usersItems.resources.length) {
			embedInfo.addField(ITEM_TYPES.resources.name, usersItems.resources.join('\n'), true)
		}

		if (usersItems.storage.length) {
			embedInfo.addField(ITEM_TYPES.storage.name, usersItems.storage.join('\n'), true)
		}

		if (!usersItems.ranged.length && !usersItems.melee.length && !usersItems.usables.length && !usersItems.ammo.length && !usersItems.resources.length && !usersItems.storage.length) {
			embedInfo.addField('This inventory is empty! :(', '\u200b')
		}

		embedInfo.addField('\u200b', `Inventory space: ${itemCt.capacity} max | Value: ${app.common.formatNumber(usersItems.invValue + userRow.money)}`)

		return {
			embed: embedInfo.embed
		}
	}
	catch (err) {
		console.log(err)
		return {
			content: '❌ There was an error trying to fetch inventory. Make sure you mention the user.'
		}
	}
}
